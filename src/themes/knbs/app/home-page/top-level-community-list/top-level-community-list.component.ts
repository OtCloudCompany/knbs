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
  styleUrls: ['../../../../../app/home-page/top-level-community-list/top-level-community-list.component.scss'],
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
    'edabef7e-8819-4cf8-877d-7c4c4fd70043': 'fa-address-card',
    '188cee0e-d8a0-4889-a5a9-f5a2b71b87d7': 'fa-area-chart',
    '6ed8c658-6db1-4167-8e84-838567d90fa3': 'fa-book',
    '1d7c2a34-691d-46be-bf79-339d7c92f4d4': 'fa-line-chart',
    'fd2daf80-57ed-44bc-b8a8-22df0adb4036': 'fa-university',
    'd13c04ec-65fb-4afd-b23e-91e33fbaa660': 'fa-chart-area',
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
            name: community.name,
            uuid: community.uuid,
            logo: community.uuid,
            itemsCount: community.archivedItemsCount > 0 ? community.archivedItemsCount : 0,
          };
        });

        // Step 3: Sort the communities based on the order in featuredCommunities
        // Since the values are now strings (icons), we need a different sorting strategy or keep the original map for sorting.
        // Wait, the original map values assumed numbers for sorting? NO, the previous code had:
        // '...': 1, '...': 2 ...
        // But the user changed it to:
        // '...': 'fa-address-card', ...
        // So the sorting logic: `featuredCommunities[a.uuid] - featuredCommunities[b.uuid]` is now broken because you can't subtract strings.
        // I should probably fix the sorting too, but let's first fix the compilation error.
        // Actually, I can just use the keys order if I wanted, or maybe the user intends to sort by name?
        // Let's assume for now that the user might have broken the sorting logic with their change.
        // However, I must fix the variable access first. `this.featuredCommunities`

        // Use a predefined order array for sorting based on the keys
        const order = [
          'edabef7e-8819-4cf8-877d-7c4c4fd70043',
          '188cee0e-d8a0-4889-a5a9-f5a2b71b87d7',
          '6ed8c658-6db1-4167-8e84-838567d90fa3',
          '1d7c2a34-691d-46be-bf79-339d7c92f4d4',
          'fd2daf80-57ed-44bc-b8a8-22df0adb4036',
          'd13c04ec-65fb-4afd-b23e-91e33fbaa660'
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
