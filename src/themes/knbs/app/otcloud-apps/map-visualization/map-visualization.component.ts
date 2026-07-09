import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest,
  Observable,
  of,
} from 'rxjs';
import {
  map,
  switchMap,
} from 'rxjs/operators';

import { environment } from 'src/environments/environment';

import { BitstreamDataService } from 'src/app/core/data/bitstream-data.service';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { Bitstream } from 'src/app/core/shared/bitstream.model';
import { BitstreamFormat } from 'src/app/core/shared/bitstream-format.model';
import { Item } from 'src/app/core/shared/item.model';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';
import { hasValue, isEmpty } from 'src/app/shared/empty.util';
import { MetadataFieldWrapperComponent } from 'src/app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { ThemedLoadingComponent } from 'src/app/shared/loading/themed-loading.component';
import { followLink } from 'src/app/shared/utils/follow-link-config.model';

const MAP_FILE_EXTENSIONS = ['json', 'geojson'];
const MAP_FILE_MIMETYPES = ['application/json', 'application/geo+json'];

/**
 * Displays a "View Map" button for item page bitstreams that are map files (JSON / GeoJSON),
 * and renders the selected file on a leaflet map when clicked.
 */
@Component({
  selector: 'ds-map-visualization',
  templateUrl: './map-visualization.component.html',
  styleUrl: './map-visualization.component.scss',
  imports: [
    MetadataFieldWrapperComponent,
    ThemedLoadingComponent,
    TranslateModule,
  ],
})
export class MapVisualizationComponent implements OnInit, OnDestroy {

  @Input() item: Item;

  mapBitstreams: Bitstream[] = [];

  activeBitstream: Bitstream;

  mapLoading = false;

  mapError = false;

  private geoJsonData: any;

  private map: any;

  private readonly DEFAULT_CENTRE_POINT = [
    environment.geospatialMapViewer.defaultCentrePoint.lat,
    environment.geospatialMapViewer.defaultCentrePoint.lng,
  ];

  constructor(
    private bitstreamDataService: BitstreamDataService,
    private http: HttpClient,
    private elRef: ElementRef,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: string,
  ) {
  }

  ngOnInit(): void {
    this.loadMapBitstreams();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  /**
   * Show the map for the given bitstream, or hide it if it's already showing
   */
  toggleMap(bitstream: Bitstream): void {
    if (this.activeBitstream?.id === bitstream.id) {
      this.closeMap();
      return;
    }
    this.destroyMap();
    this.activeBitstream = bitstream;
    this.geoJsonData = undefined;
    this.mapError = false;
    this.mapLoading = true;
    this.http.get(bitstream._links.content.href).subscribe({
      next: (data) => {
        this.geoJsonData = data;
        this.mapLoading = false;
        // This component sits inside an OnPush ancestor (UntypedItemComponent), so an
        // async response arriving outside of a template event needs an explicit markForCheck
        // or the view will never reflect mapLoading/geoJsonData changing.
        this.cdr.markForCheck();
        // Render after the canvas element has appeared in the DOM
        setTimeout(() => this.renderMap(), 0);
      },
      error: () => {
        this.mapError = true;
        this.mapLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private closeMap(): void {
    this.destroyMap();
    this.activeBitstream = undefined;
    this.geoJsonData = undefined;
    this.mapError = false;
  }

  private loadMapBitstreams(): void {
    this.bitstreamDataService.findAllByItemAndBundleName(
      this.item,
      'ORIGINAL',
      { elementsPerPage: 9999 },
      true,
      true,
      followLink('format'),
    ).pipe(
      getFirstCompletedRemoteData(),
      switchMap((bitstreamsRD: RemoteData<PaginatedList<Bitstream>>) => {
        if (!bitstreamsRD.hasSucceeded || isEmpty(bitstreamsRD.payload?.page)) {
          return of([]);
        }
        const bitstreams = bitstreamsRD.payload.page;
        const withFormat$: Observable<{ bitstream: Bitstream, format?: BitstreamFormat }>[] = bitstreams.map((bitstream) =>
          (bitstream.format as Observable<RemoteData<BitstreamFormat>>).pipe(
            getFirstCompletedRemoteData(),
            map((formatRD) => ({ bitstream, format: formatRD.hasSucceeded ? formatRD.payload : undefined })),
          ),
        );
        return combineLatest(withFormat$);
      }),
    ).subscribe((results) => {
      this.mapBitstreams = results
        .filter(({ bitstream, format }) => this.isMapFile(bitstream, format))
        .map(({ bitstream }) => bitstream);
      this.cdr.markForCheck();
    });
  }

  private isMapFile(bitstream: Bitstream, format?: BitstreamFormat): boolean {
    const name = bitstream.name?.toLowerCase() ?? '';
    if (MAP_FILE_EXTENSIONS.some((ext) => name.endsWith(`.${ext}`))) {
      return true;
    }
    if (hasValue(format)) {
      const mimetype = format.mimetype?.toLowerCase() ?? '';
      if (MAP_FILE_MIMETYPES.includes(mimetype)) {
        return true;
      }
      if (format.extensions?.some((ext) => MAP_FILE_EXTENSIONS.includes(ext.toLowerCase()))) {
        return true;
      }
    }
    return false;
  }

  private renderMap(): void {
    if (!isPlatformBrowser(this.platformId) || !hasValue(this.geoJsonData)) {
      return;
    }
    const el = this.elRef.nativeElement.querySelector('div.map-visualization-canvas');
    if (!hasValue(el)) {
      return;
    }
    // 'Import' leaflet in a browser-mode-only way to avoid issues with SSR
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet'); require('leaflet-providers');
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/images/marker-icon-2x.png',
      iconUrl: 'assets/images/marker-icon-2x.png',
      shadowUrl: 'assets/images/marker-shadow.png',
    });
    this.map = L.map(el, {
      center: this.DEFAULT_CENTRE_POINT,
      zoom: 2,
      worldCopyJump: true,
    });
    environment.geospatialMapViewer.tileProviders.forEach((provider) => {
      L.tileLayer.provider(provider, { maxZoom: 18, minZoom: 1 }).addTo(this.map);
    });
    const geoJsonLayer = L.geoJSON(this.geoJsonData).addTo(this.map);
    setTimeout(() => {
      this.map.invalidateSize(true);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid && bounds.isValid()) {
        this.map.fitBounds(bounds);
      }
    }, 250);
  }

  private destroyMap(): void {
    if (hasValue(this.map)) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
