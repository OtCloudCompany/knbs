import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DSpaceObject } from 'src/app/core/shared/dspace-object.model';
import { UsageReport } from 'src/app/core/statistics/models/usage-report.model';
import { UsageReportDataService } from 'src/app/core/statistics/usage-report-data.service';

@Component({
  selector: 'ds-usage-metrics',
  imports: [TranslateModule],
  templateUrl: './usage-metrics.component.html',
  styleUrl: './usage-metrics.component.scss',
})
export class UsageMetricsComponent implements OnInit {
  @Input() item: DSpaceObject;
  @Output() reportLoaded = new EventEmitter<UsageReport[]>();

  usageReport: UsageReport[] | null;
  retrievedMonths: string[] = [];
  dataList: any[] = [];
  reportsLoaded = false;

  totalViews: number;
  totalDownloads: number;
  topCountries: UsageReport;
  topCities: UsageReport;
  countriesMapData = [];
  countriesTableData = [];
  citiesTableData = [];
  cityNames = [];
  cityViews = [];
  constructor(private usageReportDataService: UsageReportDataService) { }

  ngOnInit(): void {
    const report = this.usageReportDataService.searchStatistics(this.item._links.self.href, 0, 10);
    report.subscribe((uReport: UsageReport[]) => {
      this.usageReport = uReport;
      uReport.forEach(repo => {
        if (repo.reportType === 'TotalVisits') {
          this.totalViews = repo.points.reduce(
            (sum, item) => sum + Number(item.values['views']), 0);
        } else if (repo.reportType === 'TotalVisitsPerMonth') {
          this.retrievedMonths = repo.points.map(item => item.label);
          this.dataList = repo.points.map(item => item.values['views']);
        } else if (repo.reportType === 'TotalDownloads') {
          this.totalDownloads = repo.points.reduce(
            (sum, item) => sum + Number(item.values['views']), 0);
        } else if (repo.reportType === 'TopCountries') {
          repo.points.forEach((item, indexNum) => {
            this.countriesMapData.push([item.id.toLowerCase(), item.values['views']]);
            this.countriesTableData.push({
              'indexNum': Number(indexNum) + 1,
              'countryLabel': item.label,
              'value': item.values['views'],
            });
          });
        } else if (repo.reportType === 'TopCities') {
          repo.points.forEach((item, indexNum) => {
            this.cityNames.push(item.label);
            this.cityViews.push(item.values['views']);
            this.citiesTableData.push({
              'indexNum': Number(indexNum) + 1,
              'cityLabel': item.label,
              'value': item.values['views'],
            });
          });
        }
      });
      this.reportLoaded.emit(uReport);
      this.reportsLoaded = true;
    });
  }

  extractDateParts(dateStr: string): number[] {
    return dateStr.split('-').map(part => parseInt(part, 10));
  }

}
