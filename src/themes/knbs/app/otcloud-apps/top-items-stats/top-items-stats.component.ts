import { Component, OnInit, Input, Inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from 'src/config/app-config.interface';
import { DSpaceObjectDataService } from 'src/app/core/data/dspace-object-data.service';
import { DSONameService } from 'src/app/core/breadcrumbs/dso-name.service';
import { getFirstSucceededRemoteData } from 'src/app/core/shared/operators';


export interface ItemStat {
  id: string;
  label: string;
  views: number;
  downloads: number;
  type: string;
}

export interface StatsResponse {
  content: ItemStat[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'ds-top-items-stats',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterLink, NgbDatepickerModule],
  templateUrl: './top-items-stats.component.html',
  styleUrl: './top-items-stats.component.scss',
})
export class TopItemsStatsComponent implements OnInit, OnDestroy {
  @Input() uuid?: string;
  @Input() object?: any;

  protected readonly Math = Math;

  allStatsContent: ItemStat[] = [];
  displayedStatsContent: ItemStat[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  validationError: string | null = null;

  resolvedUuid: string | null = null;
  resolvedObject: any = null;
  resolvedObjectName = '';
  maxViews = 1;
  maxDownloads = 1;

  currentPage = 0;
  pageSize = 20; // default local page size
  totalElements = 0;
  totalPages = 1;

  filterForm = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    size: new FormControl(this.pageSize),
  });

  private sub?: Subscription;
  private routeSub?: Subscription;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dsoService: DSpaceObjectDataService,
    private dsoNameService: DSONameService,
    @Inject(APP_CONFIG) protected appConfig: AppConfig
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const routeUuid = params['uuid'];
      this.resolvedUuid = routeUuid || this.uuid || this.object?.uuid || this.object?.id;
      if (this.resolvedUuid) {
        this.fetchObject();
        this.fetchStats(true); // initial load
      } else {
        this.errorMessage = 'No UUID provided for top items statistics.';
      }
    });
  }

  fetchObject(): void {
    if (this.object) {
      this.resolvedObject = this.object;
      this.resolvedObjectName = this.dsoNameService.getName(this.object);
      this.cdr.detectChanges();
      return;
    }
    if (!this.resolvedUuid) {
      return;
    }
    this.dsoService.findById(this.resolvedUuid).pipe(
      getFirstSucceededRemoteData()
    ).subscribe((rd) => {
      if (rd.hasSucceeded && rd.payload) {
        this.resolvedObject = rd.payload;
        this.resolvedObjectName = this.dsoNameService.getName(this.resolvedObject);
        this.cdr.detectChanges();
      }
    });
  }

  fetchStats(resetPage = false): void {
    if (!this.resolvedUuid) {
      return;
    }

    if (resetPage) {
      this.currentPage = 0;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.validationError = null;
    this.cdr.detectChanges();

    const baseUrl = this.appConfig.rest.baseUrl;
    const separator = baseUrl.endsWith('/') ? '' : '/';
    const url = `${baseUrl}${separator}api/otcloud-stats/top-items`;

    this.pageSize = this.filterForm.value.size || 5;

    let params = new HttpParams()
      .set('uuid', this.resolvedUuid)
      .set('size', this.pageSize.toString())
      .set('page', this.currentPage.toString());

    // console.log(`[TopItemsStatsComponent] Fetching stats: page=${this.currentPage}, size=${this.pageSize}, URL: ${url}?${params.toString()}`);

    // Handle date filtering if both dates are specified
    const startDateVal = this.filterForm.value.startDate as any;
    const endDateVal = this.filterForm.value.endDate as any;

    if (startDateVal && endDateVal) {
      let startISO = '';
      let endISO = '';

      if (typeof startDateVal === 'object' && 'year' in startDateVal && 'month' in startDateVal && 'day' in startDateVal) {
        const startMonth = startDateVal.month.toString().padStart(2, '0');
        const startDay = startDateVal.day.toString().padStart(2, '0');
        startISO = `${startDateVal.year}-${startMonth}-${startDay}T00:00:00Z`;
      } else {
        startISO = `${startDateVal}T00:00:00Z`;
      }

      if (typeof endDateVal === 'object' && 'year' in endDateVal && 'month' in endDateVal && 'day' in endDateVal) {
        const endMonth = endDateVal.month.toString().padStart(2, '0');
        const endDay = endDateVal.day.toString().padStart(2, '0');
        endISO = `${endDateVal.year}-${endMonth}-${endDay}T23:59:59Z`;
      } else {
        endISO = `${endDateVal}T23:59:59Z`;
      }

      params = params.set('startDate', startISO).set('endDate', endISO);
    }

    if (this.sub) {
      this.sub.unsubscribe();
    }

    this.sub = this.http.get<StatsResponse>(url, { params }).subscribe({
      next: (response) => {
        this.allStatsContent = response.content || [];
        this.displayedStatsContent = this.allStatsContent;
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 1;

        // Calculate max views/downloads to normalize visual bar widths (if needed)
        if (this.displayedStatsContent.length > 0) {
          this.maxViews = Math.max(...this.displayedStatsContent.map(item => item.views), 1);
          this.maxDownloads = Math.max(...this.displayedStatsContent.map(item => item.downloads), 1);
        } else {
          this.maxViews = 1;
          this.maxDownloads = 1;
        }

        // Dynamically resolve missing titles
        this.displayedStatsContent.forEach((item) => {
          if (!item.label) {
            this.dsoService.findById(item.id).pipe(
              getFirstSucceededRemoteData()
            ).subscribe((rd) => {
              if (rd.hasSucceeded && rd.payload) {
                item.label = this.dsoNameService.getName(rd.payload);
                this.cdr.detectChanges();
              } else {
                item.label = 'Untitled Item';
                this.cdr.detectChanges();
              }
            });
          }
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching top items stats:', err);
        this.errorMessage = 'Failed to load usage statistics. Please check your network or try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    const startDateVal = this.filterForm.value.startDate as any;
    const endDateVal = this.filterForm.value.endDate as any;

    // Both dates must be filled if either of them is filled
    if ((startDateVal && !endDateVal) || (!startDateVal && endDateVal)) {
      this.validationError = 'Both Start Date and End Date are required to apply date filtering.';
      this.cdr.detectChanges();
      return;
    }

    this.fetchStats(true);
  }

  onReset(): void {
    this.filterForm.patchValue({
      startDate: '',
      endDate: '',
    });
    this.validationError = null;
    this.fetchStats(true);
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.fetchStats(false);
      this.cdr.detectChanges();
    }
  }

  onPageSizeChange(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const newSize = parseInt(selectEl.value, 10);
    this.filterForm.patchValue({ size: newSize });
    this.pageSize = newSize;
    this.fetchStats(true);
    this.cdr.detectChanges();
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  downloadCSV(): void {
    if (!this.resolvedUuid || this.totalElements === 0) {
      return;
    }

    const baseUrl = this.appConfig.rest.baseUrl;
    const separator = baseUrl.endsWith('/') ? '' : '/';
    const url = `${baseUrl}${separator}api/otcloud-stats/top-items`;

    let params = new HttpParams()
      .set('uuid', this.resolvedUuid)
      .set('size', this.totalElements.toString())
      .set('page', '0');

    const startDateVal = this.filterForm.value.startDate as any;
    const endDateVal = this.filterForm.value.endDate as any;

    if (startDateVal && endDateVal) {
      let startISO = '';
      let endISO = '';

      if (typeof startDateVal === 'object' && 'year' in startDateVal && 'month' in startDateVal && 'day' in startDateVal) {
        const startMonth = startDateVal.month.toString().padStart(2, '0');
        const startDay = startDateVal.day.toString().padStart(2, '0');
        startISO = `${startDateVal.year}-${startMonth}-${startDay}T00:00:00Z`;
      } else {
        startISO = `${startDateVal}T00:00:00Z`;
      }

      if (typeof endDateVal === 'object' && 'year' in endDateVal && 'month' in endDateVal && 'day' in endDateVal) {
        const endMonth = endDateVal.month.toString().padStart(2, '0');
        const endDay = endDateVal.day.toString().padStart(2, '0');
        endISO = `${endDateVal.year}-${endMonth}-${endDay}T23:59:59Z`;
      } else {
        endISO = `${endDateVal}T23:59:59Z`;
      }

      params = params.set('startDate', startISO).set('endDate', endISO);
    }

    this.http.get<StatsResponse>(url, { params }).subscribe({
      next: (response) => {
        const items = response.content || [];
        const obsList = items.map(item => {
          if (!item.label) {
            return this.dsoService.findById(item.id).pipe(
              getFirstSucceededRemoteData(),
              map(rd => {
                if (rd.hasSucceeded && rd.payload) {
                  item.label = this.dsoNameService.getName(rd.payload);
                } else {
                  item.label = 'Untitled Item';
                }
                return item;
              })
            );
          } else {
            return of(item);
          }
        });

        forkJoin(obsList).subscribe((resolvedItems) => {
          this.triggerCSVDownload(resolvedItems);
        });
      },
      error: (err) => {
        console.error('Error fetching CSV data:', err);
      }
    });
  }

  triggerCSVDownload(items: ItemStat[]): void {
    const headers = ['Rank', 'Title (ID)', 'Views', 'Downloads'];
    const rows = items.map((item, index) => {
      const label = item.label || 'Untitled Item';
      return [
        index + 1,
        `"${label.replace(/"/g, '""')}" (${item.id})`,
        item.views,
        item.downloads
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const cleanName = this.resolvedObjectName ? this.resolvedObjectName.replace(/[^a-zA-Z0-9]/g, '_') : 'Collection';
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Usage_Statistics_${cleanName}_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
