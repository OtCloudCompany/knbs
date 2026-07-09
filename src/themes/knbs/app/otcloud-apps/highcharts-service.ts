import { isPlatformBrowser } from '@angular/common';
import {
    Inject,
    Injectable,
    PLATFORM_ID,
} from '@angular/core';
// Import world map data
import worldMap from '@highcharts/map-collection/custom/world.geo.json';
import * as Highcharts from 'highcharts';
import ExportingModule from 'highcharts/modules/exporting';
import MapModule from 'highcharts/modules/map';

@Injectable({
    providedIn: 'root',
})
export class HighchartsService {
    Highcharts: any = Highcharts;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            // Initialize the modules
            MapModule(Highcharts);
            ExportingModule(Highcharts);

            // Add map data to Highcharts
            Highcharts.maps['custom/world'] = worldMap;
        }
    }

    getHighcharts(): any {
        return this.Highcharts;
    }

}