<template>
  <main-layout>
    <q-splitter class="full-height full-width" after-class="q-splitter__right-panel" v-model="listSplitterWidth"
                :limits="[10,30]">
      <template v-slot:before>
        <div class="flex column full-height">
          <q-toolbar class="col-auto q-my-sm">
            <div class="flex">
              <q-btn flat color="grey-8" size="mg" no-wrap :disable="checkedIds.length === 0"
                     @click="askDeleteCheckedMailingLists">
                <Trash></Trash>
                <span>{{ countLabel }}</span>
                <q-tooltip>
                  {{ $t('COREWEBCLIENT.ACTION_DELETE') }}
                </q-tooltip>
              </q-btn>
              <q-btn flat color="grey-8" size="mg" @click="routeCreateMailingList">
                <Add></Add>
                <q-tooltip>
                  {{ $t('MTACONNECTORWEBCLIENT.HEADING_CREATE_MAILINGLIST') }}
                </q-tooltip>
              </q-btn>
              <div>
                <q-select outlined dense class="domains-select" bg-color="white" v-model="currentDomain"
                          :options="domainOptions">
                  <template v-slot:selected>
                    <div class="ellipsis">{{ currentDomain.label }}</div>
                  </template>
                </q-select>
              </div>
            </div>
          </q-toolbar>
          <StandardList class="col-grow" :items="mailingListsItems" :selectedItem="selectedMailingListId" :loading="loadingMailingLists"
                        :search="search" :page="page" :pagesCount="pagesCount"
                        ref="mailingList" @route="route" @check="afterCheck"/>
        </div>
      </template>
      <template v-slot:after>
        <router-view @mailinglist-created="handleCreateMailingList"
                     @cancel-create="route" @delete-mailingList="askDeleteMailingList" :deletingIds="deletingIds"
                     :domains="domainOptions" :domain="currentDomain"/>
      </template>
      <ConfirmDialog ref="confirmDialog"/>
    </q-splitter>
  </main-layout>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'
import cache from '../cache'

import MainLayout from 'src/layouts/MainLayout'
import ConfirmDialog from 'src/components/ConfirmDialog'
import StandardList from 'src/components/StandardList'
import Add from 'src/assets/icons/Add'
import Trash from 'src/assets/icons/Trash'

export default {
  name: 'MailingLists',

  components: {
    MainLayout,
    ConfirmDialog,
    StandardList,
    Add,
    Trash
  },

  data () {
    return {
      mailingLists: [],
      domainOptions: [],
      currentDomain: {
        label: this.$t('MTACONNECTORWEBCLIENT.LABEL_ALL_DOMAINS'),
        value: -1
      },
      selectedMailingListId: 0,
      loadingMailingLists: false,
      totalCount: 0,
      search: '',
      page: 1,
      limit: 10,
      mailingListsItems: [],
      checkedIds: [],
      justCreatedId: 0,
      deletingIds: [],
      listSplitterWidth: localStorage.getItem('aurora_admin_mailing_lists_splitter-width') || 20,
    }
  },

  computed: {
    currentTenantId () {
      return this.$store.getters['tenants/getCurrentTenantId']
    },

    domains () {
      const allDomainLists = this.$store.getters['maildomains/getDomains']
      return typesUtils.pArray(allDomainLists[this.currentTenantId])
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
    domains (domains) {
      this.domainOptions = domains.map(domain => {
        return {
          value: domain.id,
          label: domain.name
        }
      })
      this.domainOptions.unshift(this.currentDomain)
    },

    currentTenantId () {
      this.populate()
    },

    currentDomain () {
      this.getMailingLists()
    },

    $route (to, from) {
      this.parseRoute()
    },

    mailingLists () {
      this.mailingListsItems = this.mailingLists.map(mailingList => {
        return {
          id: mailingList.id,
          title: mailingList.name,
          rightText: mailingList.count,
          checked: false,
        }
      })
    },

    listSplitterWidth () {
      localStorage.setItem('aurora_admin_mailing_lists_splitter-width', this.listSplitterWidth)
    }
  },

  mounted () {
    this.populate()
    this.parseRoute()
  },

  methods: {
    parseRoute () {
      if (this.$route.path === '/mailinglists/create') {
        this.selectedMailingListId = 0
      } else {
        const search = typesUtils.pString(this.$route?.params?.search)
        const page = typesUtils.pPositiveInt(this.$route?.params?.page)
        if (this.search !== search || this.page !== page || this.justCreatedId !== 0) {
          this.search = search
          this.page = page
          this.populate()
        }
        const domainId = typesUtils.pNonNegativeInt(this.$route?.params?.id)
        if (this.selectedMailingListId !== domainId) {
          this.selectedMailingListId = domainId
        }
      }
    },

    populate () {
      this.loadingMailingLists = true
      this.requestDomains()
      this.getMailingLists()
    },

    getMailingLists () {
      cache.getPagedMailingLists(this.currentTenantId, this.search, this.page, this.limit, this.currentDomain.value).then(({ mailingLists, totalCount, tenantId, search, page, limit }) => {
        if (page === this.page && search === this.search) {
          this.mailingLists = mailingLists
          this.totalCount = totalCount
          this.loadingMailingLists = false
          this.route()
          this.justCreatedId = 0
        }
      })
    },

    route (mailingListId = 0) {
      const enteredSearch = this.$refs?.mailingList?.enteredSearch || ''
      const searchRoute = enteredSearch !== '' ? `/search/${enteredSearch}` : ''
      let selectedPage = this.$refs?.mailingList?.selectedPage || 1
      if (this.search !== enteredSearch) {
        selectedPage = 1
      }
      const pageRoute = selectedPage > 1 ? `/page/${selectedPage}` : ''
      const idRoute = mailingListId > 0 ? `/id/${mailingListId}` : ''
      const path = '/mailinglists' + searchRoute + pageRoute + idRoute
      if (path !== this.$route.path) {
        this.$router.push(path)
      }
    },

    requestDomains () {
      this.$store.dispatch('maildomains/requestDomains', {
        tenantId: this.currentTenantId
      })
    },

    routeCreateMailingList() {
      this.$router.push('/mailinglists/create')
    },

    handleCreateMailingList (id) {
      this.justCreatedId = id
      this.route()
      this.populate()
    },

    afterCheck (ids) {
      this.checkedIds = ids
    },

    askDeleteMailingList (id) {
      this.askDeleteMailingLists([id])
    },

    askDeleteCheckedMailingLists () {
      this.askDeleteMailingLists(this.checkedIds)
    },

    askDeleteMailingLists (ids) {
      if (_.isFunction(this?.$refs?.confirmDialog?.openDialog)) {
        const mailingList = ids.length === 1
          ? this.mailingLists.find(domain => {
            return domain.id === ids[0]
          })
          : null
        const title = mailingList ? mailingList.name : ''
        this.$refs.confirmDialog.openDialog({
          title,
          message: this.$tc('MTACONNECTORWEBCLIENT.CONFIRM_DELETE_MAILINGLIST_PLURAL', ids.length),
          okHandler: this.deleteMailingLists.bind(this, ids)
        })
      }
    },

    deleteMailingLists (ids) {
      this.deletingIds = ids
      this.loadingMailingLists = true
      const parameters = {
        IdList: ids,
        Type: 'MailingList',
        TenantId: this.currentTenantId,
        DeletionConfirmedByAdmin: true
      }
      webApi.sendRequest({
        moduleName: 'MtaConnector',
        methodName: 'DeleteMailingLists',
        parameters
      }).then(result => {
        this.deletingIds = []
        this.loadingMailingLists = false
        if (result === true) {
          notification.showReport(this.$tc('MTACONNECTORWEBCLIENT.REPORT_DELETE_ENTITIES_MAILINGLIST_PLURAL', ids.length))
          const isSelectedMailingListRemoved = ids.indexOf(this.selectedMailingListId) !== -1
          const selectedPage = this.$refs?.mailingList?.selectedPage || 1
          const shouldChangePage = this.mailingLists.length === ids.length && selectedPage > 1
          if (shouldChangePage && _.isFunction(this.$refs?.mailingList?.decreasePage)) {
            this.$refs.mailingList.decreasePage()
          } else if (isSelectedMailingListRemoved) {
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
        this.loadingMailingLists = false
        notification.showError(errors.getTextFromResponse(error, this.$tc('MAILDOMAINS.ERROR_DELETE_ENTITIES_MAILDOMAIN_PLURAL', ids.length)))
      })
    },
  },
}
</script>

<style lang="scss">
</style>
