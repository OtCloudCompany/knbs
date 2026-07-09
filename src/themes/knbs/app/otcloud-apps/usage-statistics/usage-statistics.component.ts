import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import worldMap from '@highcharts/map-collection/custom/world.geo.json';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { UsageReport } from 'src/app/core/statistics/models/usage-report.model';
import * as Highcharts from 'highcharts';
import { RouteService } from 'src/app/core/services/route.service';
import { Router } from '@angular/router';
import { HighchartsService } from '../highcharts-service';
import { UsageReportDataService } from 'src/app/core/statistics/usage-report-data.service';
import { APP_CONFIG, AppConfig } from 'src/config/app-config.interface';
import { Item } from 'src/app/core/shared/item.model';
import { hasValue } from 'src/app/shared/empty.util';
import { HighchartsChartModule } from 'highcharts-angular';

@Component({
  selector: 'ds-usage-statistics',
  imports: [CommonModule, NgbNavModule, TranslateModule, HighchartsChartModule],
  templateUrl: './usage-statistics.component.html',
  styleUrl: './usage-statistics.component.scss',
})
export class UsageStatisticsComponent implements OnInit {
  @Input() object: Item;
  Highcharts: any;
  topCountries: UsageReport;
  topCities: UsageReport;
  countriesMapData = [];
  countriesTableData = [];
  citiesTableData = [];

  citiesBarGraphOptions: Highcharts.Options;
  chartOptions: any;
  mapChartOptions: any;

  cityNames = [];
  cityViews = [];
  usageReport: UsageReport[] | null;
  retrievedMonths: string[] = [];
  dataList: any[] = [];
  reportsLoaded = false;

  constructor(
    protected routeService: RouteService,
    private highchartsService: HighchartsService,
    protected router: Router,
    protected usageReportDataService: UsageReportDataService,
    private cd: ChangeDetectorRef,
    @Inject(APP_CONFIG) protected appConfig: AppConfig) {
  }

  ngOnInit() {
    this.Highcharts = this.highchartsService.getHighcharts();

    const report = this.usageReportDataService
      .searchStatistics(this.object._links.self.href, 0, 10);

    report.subscribe((uReport: UsageReport[]) => {
      this.usageReport = uReport;

      uReport.forEach(repo => {
        if (repo.reportType === 'TotalVisitsPerMonth') {
          this.retrievedMonths = repo.points.map(item => item.label);
          this.dataList = repo.points.map(item => item.values['views']);
        } else if (repo.reportType === 'TopCountries') {
          repo.points.forEach((item, indexNum) => {

            this.countriesMapData.push([item.id.toLowerCase(), Number(item.values['views'])]);
            if (this.countriesTableData.length < 10) {
              this.countriesTableData.push({
                'indexNum': Number(indexNum) + 1,
                'countryLabel': item.label,
                'value': item.values['views'],
              });
            }
          });
        } else if (repo.reportType === 'TopCities') {
          repo.points.forEach((item, indexNum) => {
            this.cityNames.push(item.label);
            this.cityViews.push(Number(item.values['views']));
            if (this.citiesTableData.length < 10) {
              this.citiesTableData.push({
                'indexNum': Number(indexNum) + 1,
                'cityLabel': item.label,
                'value': item.values['views'],
              });
            }

          });
        }
      });
      this.setCountriesChartOptions();
      this.setCitiesBarGraphOptions();
      this.setChartOptions();
      this.reportsLoaded = true;
      this.cd.detectChanges();
    });
  }

  truncateVal(value: string, args: string[]): string {
    if (hasValue(value)) {
      const limit = (args && args.length > 0) ? parseInt(args[0], 10) : 10; // 10 as default truncate value
      return value.length > limit ? value.substring(0, limit) : value + '...';
    } else {
      return value;
    }
  }

  setCountriesChartOptions() {
    this.mapChartOptions = {
      chart: {
        map: 'custom/world'
      },
      title: {
        text: 'World Map'
      },
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },
      colorAxis: {
        min: 0
      },
      series: [
        {
          type: 'map',
          name: 'Views',
          mapData: worldMap,
          data: this.countriesMapData,
          joinBy: ['hc-key', 0],
          dataLabels: {
            enabled: true,
            format: '{point.value}'
          },
          tooltip: {
            pointFormat: '{point.name}: {point.value}'
          }
        }
      ]
    };
  }

  setCitiesBarGraphOptions() {

    this.citiesBarGraphOptions = {
      chart: { type: 'bar' },
      title: { text: '' },
      xAxis: {
        categories: this.cityNames,
        title: { text: null }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Views',
          align: 'high'
        },
        labels: { overflow: 'justify' }
      },
      plotOptions: {
        bar: {
          dataLabels: { enabled: true }
        }
      },
      series: [{
        type: 'bar',
        name: 'Views',
        data: this.cityViews
      }]
    };
  }

  setChartOptions() {
    this.chartOptions = {
      title: {
        text: ''
      },
      xAxis: {
        categories: this.retrievedMonths
      },
      yAxis: {
        title: {
          text: 'Views'
        }
      },
      series: [
        {
          type: 'line',
          name: 'Views',
          data: this.dataList
        }
      ]
    };
  }
}
