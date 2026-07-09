import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
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

import { BitstreamDataService } from 'src/app/core/data/bitstream-data.service';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { Bitstream } from 'src/app/core/shared/bitstream.model';
import { BitstreamFormat } from 'src/app/core/shared/bitstream-format.model';
import { Item } from 'src/app/core/shared/item.model';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';
import { hasValue, isEmpty } from 'src/app/shared/empty.util';
import { GeospatialMapComponent } from 'src/app/shared/geospatial-map/geospatial-map.component';
import { ThemedLoadingComponent } from 'src/app/shared/loading/themed-loading.component';
import { MetadataFieldWrapperComponent } from 'src/app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { followLink } from 'src/app/shared/utils/follow-link-config.model';

const MAP_FILE_EXTENSIONS = ['json', 'geojson'];
const MAP_FILE_MIMETYPES = ['application/json', 'application/geo+json'];

/**
 * Displays a "View Map" button for item page bitstreams that are map files (JSON / GeoJSON).
 * Reuses DSpace's existing ds-geospatial-map for the base tiled Leaflet map (tile providers,
 * marker icons, SSR guard), and overlays the fetched file as a GeoJSON layer on top of it via
 * its public `leafletMap` getter - no core files are modified.
 */
@Component({
  selector: 'ds-map-visualization',
  templateUrl: './map-visualization.component.html',
  styleUrl: './map-visualization.component.scss',
  imports: [
    GeospatialMapComponent,
    MetadataFieldWrapperComponent,
    ThemedLoadingComponent,
    TranslateModule,
  ],
})
export class MapVisualizationComponent implements OnInit, OnDestroy {

  @Input() item: Item;

  @ViewChild('geospatialMap') geospatialMapComponent?: GeospatialMapComponent;

  mapBitstreams: Bitstream[] = [];

  activeBitstream: Bitstream;

  mapLoading = false;

  mapError = false;

  private geoJsonData: any;

  private geoJsonLayer: any;

  constructor(
    private bitstreamDataService: BitstreamDataService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: string,
  ) {
  }

  ngOnInit(): void {
    this.loadMapBitstreams();
  }

  ngOnDestroy(): void {
    this.geoJsonLayer = undefined;
  }

  /**
   * Show the map for the given bitstream, or hide it if it's already showing
   */
  toggleMap(bitstream: Bitstream): void {
    if (this.activeBitstream?.id === bitstream.id) {
      this.closeMap();
      return;
    }
    this.activeBitstream = bitstream;
    this.geoJsonData = undefined;
    this.geoJsonLayer = undefined;
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
        // Draw once the map canvas (and ds-geospatial-map's own leaflet map) has appeared in the DOM
        setTimeout(() => this.drawGeoJsonLayer(), 0);
      },
      error: () => {
        this.mapError = true;
        this.mapLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private closeMap(): void {
    this.activeBitstream = undefined;
    this.geoJsonData = undefined;
    this.geoJsonLayer = undefined;
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

  /**
   * Add the fetched GeoJSON as a layer on top of ds-geospatial-map's leaflet map instance,
   * replacing any layer left over from a previously viewed bitstream.
   */
  private drawGeoJsonLayer(): void {
    const leafletMap = this.geospatialMapComponent?.leafletMap;
    if (!isPlatformBrowser(this.platformId) || !hasValue(this.geoJsonData) || !hasValue(leafletMap)) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet');
    if (hasValue(this.geoJsonLayer)) {
      leafletMap.removeLayer(this.geoJsonLayer);
    }
    this.geoJsonLayer = L.geoJSON(this.geoJsonData).addTo(leafletMap);
    setTimeout(() => {
      leafletMap.invalidateSize(true);
      const bounds = this.geoJsonLayer.getBounds();
      if (bounds.isValid && bounds.isValid()) {
        leafletMap.fitBounds(bounds);
      }
    }, 250);
  }
}
