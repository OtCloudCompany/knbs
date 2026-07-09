import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { BitstreamDataService } from 'src/app/core/data/bitstream-data.service';
import { buildPaginatedList } from 'src/app/core/data/paginated-list.model';
import { PageInfo } from 'src/app/core/shared/page-info.model';
import { Item } from 'src/app/core/shared/item.model';
import { createSuccessfulRemoteDataObject$ } from 'src/app/shared/remote-data.utils';
import { getMockTranslateService } from 'src/app/shared/mocks/translate.service.mock';

import { MapVisualizationComponent } from './map-visualization.component';

describe('MapVisualizationComponent', () => {
  let component: MapVisualizationComponent;
  let fixture: ComponentFixture<MapVisualizationComponent>;
  let bitstreamDataService: any;

  beforeEach(async () => {
    bitstreamDataService = {
      findAllByItemAndBundleName: () => createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), [])),
    };

    await TestBed.configureTestingModule({
      imports: [MapVisualizationComponent, HttpClientTestingModule],
      providers: [
        { provide: BitstreamDataService, useValue: bitstreamDataService },
        { provide: TranslateService, useValue: getMockTranslateService() },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(MapVisualizationComponent);
    component = fixture.componentInstance;
    component.item = Object.assign(new Item(), { uuid: 'test-item' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no map bitstreams when the item has no matching files', () => {
    expect(component.mapBitstreams.length).toBe(0);
  });
});
