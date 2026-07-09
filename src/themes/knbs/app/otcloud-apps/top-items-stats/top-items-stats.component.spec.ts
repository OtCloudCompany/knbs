import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { APP_CONFIG } from 'src/config/app-config.interface';
import { DSpaceObjectDataService } from 'src/app/core/data/dspace-object-data.service';
import { DSONameService } from 'src/app/core/breadcrumbs/dso-name.service';
import { TopItemsStatsComponent } from './top-items-stats.component';

describe('TopItemsStatsComponent', () => {
  let component: TopItemsStatsComponent;
  let fixture: ComponentFixture<TopItemsStatsComponent>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  const mockAppConfig = {
    rest: {
      baseUrl: 'https://mock-dspace-server.com/server'
    }
  };

  const mockActivatedRoute = {
    params: of({ uuid: '1ec4fa24-4c0e-47ef-84d8-399f1dac1e69' })
  };

  const mockStatsResponse = {
    content: [
      {
        id: 'a56ff2d0-06a9-401b-a1f7-b5b8b427df2a',
        label: 'Universidad, IA y responsabilidad',
        views: 34,
        downloads: 1,
        type: 'item-stats'
      },
      {
        id: 'a8ad0aa2-2c0b-4faa-a292-96e84ca73279',
        label: 'Hacia un foro nacional contra la violencia',
        views: 29,
        downloads: 0,
        type: 'item-stats'
      }
    ],
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      paged: true,
      unpaged: false
    },
    totalElements: 2,
    totalPages: 1,
    last: true,
    size: 20,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    numberOfElements: 2,
    first: true,
    empty: false
  };

  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    httpClientSpy.get.and.returnValue(of(mockStatsResponse));

    const mockDSONameService = {
      getName: jasmine.createSpy('getName').and.returnValue('Mock Community')
    };

    const mockDSpaceObjectService = {
      findById: jasmine.createSpy('findById').and.returnValue(of({
        hasSucceeded: true,
        payload: {
          uuid: '1ec4fa24-4c0e-47ef-84d8-399f1dac1e69',
          name: 'Mock Community'
        }
      }))
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot(),
        TopItemsStatsComponent
      ],
      providers: [
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: APP_CONFIG, useValue: mockAppConfig },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DSpaceObjectDataService, useValue: mockDSpaceObjectService },
        { provide: DSONameService, useValue: mockDSONameService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TopItemsStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch stats on init', () => {
    expect(httpClientSpy.get).toHaveBeenCalled();
    expect(component.allStatsContent).toEqual(mockStatsResponse.content as any);
    expect(component.displayedStatsContent).toEqual(mockStatsResponse.content as any);
    expect(component.maxViews).toBe(34);
    expect(component.maxDownloads).toBe(1);
  });

  it('should apply date filters when both dates are provided', () => {
    component.filterForm.patchValue({
      startDate: { year: 2026, month: 6, day: 1 } as any,
      endDate: { year: 2026, month: 6, day: 19 } as any
    });
    httpClientSpy.get.calls.reset();
    component.onSubmit();
    expect(component.validationError).toBeNull();
    const args = httpClientSpy.get.calls.mostRecent().args[1];
    const params = args?.params as HttpParams;
    expect(params?.get('startDate')).toBe('2026-06-01T00:00:00Z');
    expect(params?.get('endDate')).toBe('2026-06-19T23:59:59Z');
  });

  it('should set validation error if only one date is provided', () => {
    component.filterForm.patchValue({
      startDate: '2026-06-01',
      endDate: ''
    });
    httpClientSpy.get.calls.reset();
    component.onSubmit();
    expect(component.validationError).toBe('Both Start Date and End Date are required to apply date filtering.');
    expect(httpClientSpy.get).not.toHaveBeenCalled();
  });

  it('should reset filter dates on reset', () => {
    component.filterForm.patchValue({
      startDate: '2026-06-01',
      endDate: '2026-06-19'
    });
    httpClientSpy.get.calls.reset();
    component.onReset();
    expect(component.filterForm.value.startDate).toBe('');
    expect(component.filterForm.value.endDate).toBe('');
    expect(httpClientSpy.get).toHaveBeenCalled();
  });

  it('should fetch different page data on onPageChange', () => {
    httpClientSpy.get.calls.reset();
    component.totalPages = 3;
    component.onPageChange(1);
    expect(component.currentPage).toBe(1);
    expect(httpClientSpy.get).toHaveBeenCalled();
    const args = httpClientSpy.get.calls.mostRecent().args[1];
    const params = args?.params as HttpParams;
    expect(params?.get('page')).toBe('1');
  });

  it('should fetch with new page size and page 0 on onPageSizeChange', () => {
    httpClientSpy.get.calls.reset();
    const mockEvent = { target: { value: '10' } } as any;
    component.onPageSizeChange(mockEvent);
    expect(component.pageSize).toBe(10);
    expect(component.currentPage).toBe(0);
    expect(httpClientSpy.get).toHaveBeenCalled();
    const args = httpClientSpy.get.calls.mostRecent().args[1];
    const params = args?.params as HttpParams;
    expect(params?.get('size')).toBe('10');
    expect(params?.get('page')).toBe('0');
  });

  it('should fetch all items when downloadCSV is called and trigger download', () => {
    httpClientSpy.get.calls.reset();
    component.totalElements = 15;
    component.resolvedUuid = '1ec4fa24-4c0e-47ef-84d8-399f1dac1e69';
    spyOn(component, 'triggerCSVDownload');

    component.downloadCSV();

    expect(httpClientSpy.get).toHaveBeenCalled();
    const args = httpClientSpy.get.calls.mostRecent().args[1];
    const params = args?.params as HttpParams;
    expect(params?.get('size')).toBe('15');
    expect(params?.get('page')).toBe('0');
  });
});
