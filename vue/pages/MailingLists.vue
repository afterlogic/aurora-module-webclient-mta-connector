<template>
  <q-splitter class="full-height full-width" after-class="q-splitter__right-panel" v-model="listSplitterWidth"
              :limits="[10,30]">
    <template v-slot:before>
      <div class="flex column full-height">
        <q-toolbar class="col-auto">
          <q-btn flat color="grey-8" size="lg" :label="countLabel" :disable="checkedIds.length === 0"
                 @click="askDeleteCheckedDomains">
            <Trash></Trash>
            <q-tooltip>
              {{ $t('COREWEBCLIENT.ACTION_DELETE') }}
            </q-tooltip>
          </q-btn>
          <q-btn flat color="grey-8" size="lg" @click="routeCreateDomain">
            <Add></Add>
            <q-tooltip>
              {{ $t('MAILDOMAINS.ACTION_ADD_ENTITY_MAILDOMAIN') }}
            </q-tooltip>
          </q-btn>
        </q-toolbar>
        <StandardList class="col-grow" :items="domainItems" :selectedItem="selectedDomainId" :loading="loadingDomains"
                      :search="search" :page="page" :pagesCount="pagesCount"
                      :noItemsText="'MAILDOMAINS.INFO_NO_ENTITIES_MAILDOMAIN'"
                      :noItemsFoundText="'MAILDOMAINS.INFO_NO_ENTITIES_FOUND_MAILDOMAIN'"
                      ref="domainList" @route="route" @check="afterCheck"/>
      </div>
    </template>
    <template v-slot:after>
      <router-view @no-domain-found="handleNoDomainFound" @domain-created="handleCreateDomain"
                   @cancel-create="route" @delete-domain="askDeleteDomain" :deletingIds="deletingIds"></router-view>
    </template>
    <ConfirmDialog ref="confirmDialog"/>
  </q-splitter>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import cache from '../cache'

import ConfirmDialog from 'src/components/ConfirmDialog'
// import Empty from 'src/components/Empty'
import StandardList from 'src/components/StandardList'

// import EditDomain from '../components/EditDomain'

import Add from 'src/assets/icons/Add'
import Trash from 'src/assets/icons/Trash'

export default {
  name: 'Mailing',
  components: {
    ConfirmDialog,
    StandardList,
    Add,
    Trash
  },
  data () {
    return {
      domains: [],
      selectedDomainId: 0,
      loadingDomains: false,
      totalCount: 0,
      search: '',
      page: 1,
      limit: 10,
      domainItems: [],
      checkedIds: [],
      justCreatedId: 0,
      deletingIds: [],
      listSplitterWidth: 20,
    }
  },
  computed: {
    currentTenantId () {
      return this.$store.getters['tenants/getCurrentTenantId']
    },
    pagesCount () {
      return Math.ceil(this.totalCount / this.limit)
    },
    countLabel () {
      const count = this.checkedIds.length
      return count > 0 ? count : ''
    },
  },
  watch: {
    currentTenantId () {
      this.populate()
    },
    $route (to, from) {
      if (this.$route.path === '/domains/create') {
        this.selectedDomainId = 0
      } else {
        const search = typesUtils.pString(this.$route?.params?.search)
        const page = typesUtils.pPositiveInt(this.$route?.params?.page)
        if (this.search !== search || this.page !== page || this.justCreatedId !== 0) {
          this.search = search
          this.page = page
          this.populate()
        }
        const domainId = typesUtils.pNonNegativeInt(this.$route?.params?.id)
        if (this.selectedDomainId !== domainId) {
          this.selectedDomainId = domainId
        }
      }
    },
    domains () {
      this.domainItems = this.domains.map(domain => {
        return {
          id: domain.id,
          title: domain.name,
          rightText: domain.count,
          checked: false,
        }
      })
    },
  },
  mounted () {
    // this.$router.addRoute('domains', { path: 'id/:id', component: EditDomain })
    // this.$router.addRoute('domains', { path: 'create', component: EditDomain })
    // this.$router.addRoute('domains', { path: 'search/:search', component: Empty })
    // this.$router.addRoute('domains', { path: 'search/:search/id/:id', component: EditDomain })
    // this.$router.addRoute('domains', { path: 'page/:page', component: Empty })
    // this.$router.addRoute('domains', { path: 'page/:page/id/:id', component: EditDomain })
    // this.$router.addRoute('domains', { path: 'search/:search/page/:page', component: Empty })
    // this.$router.addRoute('domains', { path: 'search/:search/page/:page/id/:id', component: EditDomain })
    // this.populate()
    cache.getPagedMailingLists(this.currentTenantId, this.search, this.page, this.limit)
  },
  methods: {
    populate () {
      this.loadingDomains = true
      cache.getPagedDomains(this.currentTenantId, this.search, this.page, this.limit).then(({ domains, totalCount, tenantId, page, search }) => {
        if (page === this.page && search === this.search) {
          this.domains = domains
          this.totalCount = totalCount
          this.loadingDomains = false
          if (this.justCreatedId && domains.find(domain => {
            return domain.id === this.justCreatedId
          })) {
            this.route(this.justCreatedId)
            this.justCreatedId = 0
          }
        }
      })
    },
    route (domainId = 0) {
      const enteredSearch = this.$refs?.domainList?.enteredSearch || ''
      const searchRoute = enteredSearch !== '' ? `/search/${enteredSearch}` : ''
      let selectedPage = this.$refs?.domainList?.selectedPage || 1
      if (this.search !== enteredSearch) {
        selectedPage = 1
      }
      const pageRoute = selectedPage > 1 ? `/page/${selectedPage}` : ''
      const idRoute = domainId > 0 ? `/id/${domainId}` : ''
      const path = '/domains' + searchRoute + pageRoute + idRoute
      if (path !== this.$route.path) {
        this.$router.push(path)
      }
    },
    routeCreateDomain () {
      this.$router.push('/domains/create')
    },
    handleCreateDomain (id) {
      this.justCreatedId = id
      this.route()
    },
    afterCheck (ids) {
      this.checkedIds = ids
    },
    handleNoDomainFound () {
      this.route()
      this.populate()
    },
    askDeleteDomain (id) {
      this.askDeleteDomains([id])
    },
    askDeleteCheckedDomains () {
      this.askDeleteDomains(this.checkedIds)
    },
    askDeleteDomains (ids) {
      if (_.isFunction(this?.$refs?.confirmDialog?.openDialog)) {
        const domain = ids.length === 1
          ? this.domains.find(domain => {
            return domain.id === ids[0]
          })
          : null
        const title = domain ? domain.name : ''
        this.$refs.confirmDialog.openDialog({
          title,
          message: this.$tc('MAILDOMAINS.CONFIRM_DELETE_MAILDOMAIN_PLURAL', ids.length),
          okHandler: this.deleteDomains.bind(this, ids)
        })
      }
    },
    deleteDomains (ids) {
      this.deletingIds = ids
      this.loadingDomains = true
      webApi.sendRequest({
        moduleName: 'MailDomains',
        methodName: 'DeleteDomains',
        parameters: {
          IdList: ids,
          DeletionConfirmedByAdmin: true
        },
      }).then(result => {
        this.deletingIds = []
        this.loadingDomains = false
        if (result === true) {
          notification.showReport(this.$tc('MAILDOMAINS.REPORT_DELETE_ENTITIES_MAILDOMAIN_PLURAL', ids.length))
          const isSelectedDomainRemoved = ids.indexOf(this.selectedDomainId) !== -1
          const selectedPage = this.$refs?.domainList?.selectedPage || 1
          const shouldChangePage = this.domains.length === ids.length && selectedPage > 1
          if (shouldChangePage && _.isFunction(this.$refs?.domainList?.decreasePage)) {
            this.$refs.domainList.decreasePage()
          } else if (isSelectedDomainRemoved) {
            this.route()
            this.populate()
          } else {
            this.populate()
          }
        } else {
          notification.showError(this.$tc('MAILDOMAINS.ERROR_DELETE_ENTITIES_MAILDOMAIN_PLURAL', ids.length))
        }
      }, error => {
        this.deletingIds = []
        this.loadingDomains = false
        notification.showError(errors.getTextFromResponse(error, this.$tc('MAILDOMAINS.ERROR_DELETE_ENTITIES_MAILDOMAIN_PLURAL', ids.length)))
      })
    },
  },
}
</script>

<style lang="scss">
</style>
