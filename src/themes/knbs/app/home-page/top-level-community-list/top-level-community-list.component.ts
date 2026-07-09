import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  APP_CONFIG,
  AppConfig,
} from 'src/config/app-config.interface';

import { TopLevelCommunityListComponent as BaseComponent } from '../../../../../app/home-page/top-level-community-list/top-level-community-list.component';
import { ErrorComponent } from '../../../../../app/shared/error/error.component';
import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { VarDirective } from '../../../../../app/shared/utils/var.directive';
import { CommunityDataService } from 'src/app/core/data/community-data.service';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { Community } from 'src/app/core/shared/community.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { RouterLink } from '@angular/router';

interface FetchedCommunity {
  name: string;
  uuid: string;
  itemsCount: number;
  logo: string;
}

@Component({
  selector: 'ds-themed-top-level-community-list',
  styleUrls: ['./top-level-community-list.component.scss'],
  templateUrl: './top-level-community-list.component.html',
  imports: [
    AsyncPipe,
    ErrorComponent,
    ThemedLoadingComponent,
    TranslateModule,
    VarDirective,
    RouterLink,
    CommonModule,
  ],
})
export class TopLevelCommunityListComponent extends BaseComponent implements OnInit {
  communitiesFetched: FetchedCommunity[] = [];
  featuredCommunities: { [key: string]: string } = {
    '949a1deb-7ede-41c2-bdb0-502b975b243a': 'fa-address-card',
    '6d91d629-16a0-4f2b-814b-36f715a7f27f': 'fa-area-chart',
    '1d3a637d-cdd7-49de-b58b-fce48472d90a': 'fa-book',
    '9c0cc1c9-f7d6-44f9-8820-f27ec0d5b6c7': 'fa-line-chart',
    'c2bbbf97-d7b4-4bfa-a628-88c2da6cc159': 'fa-university',
    'b335bbd1-8ba9-4849-bd27-dde239a3ac74': 'fa-chart-area',
    '0306369a-cc99-40fa-8894-9a1bf500b99b': 'fa-window-restore',
  };

  constructor(@Inject(APP_CONFIG) protected appConfig: AppConfig,
    communityDataService: CommunityDataService,
    paginationService: PaginationService) {
    super(appConfig, communityDataService, paginationService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.communitiesRD$.subscribe((rsp: RemoteData<PaginatedList<Community>>) => {
      if (rsp.hasCompleted && rsp.payload) {

        // Step 1: Get only the communities that exist in featuredCommunities
        const filteredCommunities = rsp.payload.page.filter((community) => {
          return this.featuredCommunities.hasOwnProperty(community.uuid);
        });

        // Step 2: Convert the filtered communities into the desired format
        const mappedCommunities = filteredCommunities.map((community) => {
          return {
            name: community.name.replace(/^\d+\s*-\s*/, ''),
            uuid: community.uuid,
            logo: community.uuid,
            itemsCount: community.archivedItemsCount > 0 ? community.archivedItemsCount : 0,
          };
        });

        // Use a predefined order array for sorting based on the keys
        const order = [
          '949a1deb-7ede-41c2-bdb0-502b975b243a',
          '6d91d629-16a0-4f2b-814b-36f715a7f27f',
          '1d3a637d-cdd7-49de-b58b-fce48472d90a',
          '9c0cc1c9-f7d6-44f9-8820-f27ec0d5b6c7',
          'c2bbbf97-d7b4-4bfa-a628-88c2da6cc159',
          'b335bbd1-8ba9-4849-bd27-dde239a3ac74',
          '0306369a-cc99-40fa-8894-9a1bf500b99b'
        ];

        const sortedCommunities = mappedCommunities.sort((a, b) => {
          return order.indexOf(a.uuid) - order.indexOf(b.uuid);
        });

        // Step 4: Assign the final sorted list to communitiesFetched
        this.communitiesFetched = sortedCommunities;
      }
    });
  }
}
