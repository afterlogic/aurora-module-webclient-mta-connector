<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg ">
      <div class="row q-mb-md">
        <div class="col text-h5">
          {{createMode ? $t('MTACONNECTORWEBCLIENT.HEADING_CREATE_MAILINGLIST') : $t('MTACONNECTORWEBCLIENT.HEADING_EDIT_MAILINGLIST')}}
        </div>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section v-if="!createMode">
          <div class="row q-mb-md">
            <div class="col-2 q-mt-sm" v-t="'MTACONNECTORWEBCLIENT.LABEL_MEMBER'"></div>
            <div class="col-4">
              <q-input outlined dense class="bg-white" v-model="memberEmail"/>
            </div>
            <div class="col-3 q-mt-xs q-ml-md">
              <q-btn unelevated no-caps no-wrap dense class="q-ml-md q-px-sm" :ripple="false" color="primary"
                     :label="$t('MTACONNECTORWEBCLIENT.ACTION_ADD_NEW_MEMBER')"
                     @click="addNewMember"/>
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-2"/>
            <div class="col-4">
              <select size="9" class="select" multiple v-model="selectedMembers">
                <option v-for="alias in membersList" :key="alias" :value="alias">{{ alias }}</option>
              </select>
            </div>
            <div class="col-3 q-mt-xs q-ml-md" style="position: relative">
              <div style="position: absolute; bottom: 3px;">
                <q-btn unelevated no-caps no-wrap dense class="q-ml-md q-px-sm" :ripple="false" color="primary"
                       :label="$t('MTACONNECTORWEBCLIENT.ACTION_DELETE_MEMBERS')"
                       @click="deleteMembers"/>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-section v-else>
          <div class="row">
            <div class="col-2 q-mt-sm" v-t="'COREWEBCLIENT.LABEL_EMAIL'"></div>
            <div class="col-3">
              <q-input outlined dense class="bg-white" v-model="mailingListEmail"/>
            </div>
            <div class="col-3 q-ml-md" style="width: 180px">
              <q-select outlined dense class="bg-white" v-model="currentDomain" :options="currentDomains"/>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pt-md text-right">
        <q-btn v-if="!createMode" unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="deleting ? $t('MTACONNECTORWEBCLIENT.ACTION_DELETE_MAILINGLIST') : $t('MTACONNECTORWEBCLIENT.ACTION_DELETE_MAILINGLIST')" @click="deleteMailingList"/>
        <q-btn v-if="createMode" unelevated no-caps dense class="q-px-sm q-mr-sm" :ripple="false" color="primary"
               :label="creating ? $t('COREWEBCLIENT.ACTION_CREATE_IN_PROGRESS') : $t('COREWEBCLIENT.ACTION_CREATE')" @click="createMailingList"/>
        <q-btn v-if="createMode" unelevated no-caps dense class="q-px-sm" :ripple="false" color="secondary"
               :label="$t('COREWEBCLIENT.ACTION_CANCEL')" @click="cancel"/>
      </div>
    </div>
    <q-inner-loading style="justify-content: flex-start;" :showing="loading || saving || deleting">
      <q-linear-progress query class="q-mt-sm" />
    </q-inner-loading>
    <UnsavedChangesDialog ref="unsavedChangesDialog"/>
  </q-scroll-area>
</template>

<script>
import UnsavedChangesDialog from 'src/components/UnsavedChangesDialog'

import webApi from 'src/utils/web-api'
import errors from 'src/utils/errors'
import notification from 'src/utils/notification'

import types from 'src/utils/types'
import MailingListModel from '../../../MtaConnectorWebclient/vue/classes/Mailing'

export default {
  name: 'EditMailingList',
  components: {
    UnsavedChangesDialog
  },
  props: {
    domains: Array,
    domain: Object
  },
  mounted () {
    this.parseRoute()
  },
  data () {
    return {
      loading: false,
      saving: false,
      deleting: false,
      creating: false,
      currentDomains: [],
      currentDomain: '',
      memberEmail: '',
      aliasDomain: '',
      mailingListEmail: '',
      selectedMembers: [],
      membersList: [],
      mailingList: null
    }
  },
  computed: {
    currentTenantId () {
      return this.$store.getters['tenants/getCurrentTenantId']
    },
    createMode () {
      return this.mailingList?.id === 0
    },
  },
  watch: {
    $route () {
      this.parseRoute()
    }
  },
  methods: {
    createMailingList () {
      if (!this.creating) {
        this.creating = true
        const parameters = {
          Email: this.mailingListEmail + '@' + this.currentDomain.label,
          DomainId: this.currentDomain.value,
          TenantId: this.currentTenantId,
        }
        webApi.sendRequest({
          moduleName: 'MtaConnector',
          methodName: 'CreateMailingList',
          parameters,
        }).then(result => {
          this.creating = false
          if (result === true) {
            notification.showReport(this.$t('MTACONNECTORWEBCLIENT.REPORT_CREATE_ENTITY_MAILINGLIST'))
            this.$emit('mailinglist-created', 0)
            this.parseRoute()
          } else {
            notification.showError(this.$t('MTACONNECTORWEBCLIENT.ERROR_CREATE_ENTITY_MAILINGLIST'))
          }
        }, response => {
          this.creating = false
          notification.showError(errors.getTextFromResponse(response, this.$t('MTACONNECTORWEBCLIENT.ERROR_CREATE_ENTITY_MAILINGLIST')))
        })
      }
    },
    cancel () {
      this.$emit('cancel-create')
    },
    deleteMailingList () {
      this.$emit('delete-mailingList', this.mailingList.id)
    },
    parseRoute () {
      if (this.$route.path === '/mailinglists/create') {
        this.currentDomains = this.domains.filter(domain => {
          return domain.value !== -1
        })
        this.currentDomain = this.currentDomains.find(domain => {
          return domain.value === this.domain.value
        })
        const mailingList = new MailingListModel({ TenantId: this.currentTenantId })
        this.fillUp(mailingList)
      } else {
        const mailingListId = types.pPositiveInt(this.$route?.params?.id)
        if (this.mailingList?.id !== mailingListId) {
          this.mailingList = {
            id: mailingListId,
          }
          this.populate()
        }
      }
    },
    fillUp (mailingList) {
      this.mailingList = mailingList
    },
    populate () {
      this.getSettings()
    },
    addNewMember () {
      if (!this.saving) {
        if (this.memberEmail.length) {
          this.saving = true
          const parameters = {
            ListId: this.mailingList?.id,
            ListTo: this.memberEmail,
            TenantId: this.currentTenantId,
          }
          webApi.sendRequest({
            moduleName: 'MtaConnector',
            methodName: 'AddMailingListMember',
            parameters,
          }).then(result => {
            this.saving = false
            if (result === true) {
              this.memberEmail = ''
              this.populate()
            }
          }, response => {
            this.saving = false
            notification.showError(errors.getTextFromResponse(response))
          })
        } else {
          notification.showError(this.$t('COREUSERGROUPSLIMITS.ERROR_EMPTY_RESERVED_NAME'))
        }
      }
    },
    deleteMembers () {
      if (!this.deleting) {
        this.deleting = true
        if (this.selectedMembers.length) {
          const parameters = {
            TenantId: this.currentTenantId,
            ListId: this.mailingList.id,
            Members: this.selectedMembers,
          }
          webApi.sendRequest({
            moduleName: 'MtaConnector',
            methodName: 'DeleteMailingListMembers',
            parameters,
          }).then(result => {
            this.deleting = false
            if (result === true) {
              this.populate()
            }
          }, response => {
            this.deleting = false
            notification.showError(errors.getTextFromResponse(response))
          })
        } else {
          this.deleting = false
          notification.showError(this.$t('COREUSERGROUPSLIMITS.ERROR_EMPTY_RESERVED_NAMES'))
        }
      }
    },
    getSettings () {
      this.loading = true
      const parameters = {
        Type: 'MailingList',
        Id: this.mailingList.id,
        TenantId: this.currentTenantId
      }
      webApi.sendRequest({
        moduleName: 'MtaConnector',
        methodName: 'GetMailingListMembers',
        parameters
      }).then(result => {
        this.loading = false
        if (result) {
          this.membersList = types.pArray(result)
        }
      },
      response => {
        this.loading = false
        notification.showError(errors.getTextFromResponse(response))
      })
    }
  }
}
</script>

<style scoped>
.select {
  padding: 7px 9px 6px;
  border: 1px solid #cccccc;
  width: 100%;
  overflow-y: scroll;
  border-radius: 4px;
}
</style>