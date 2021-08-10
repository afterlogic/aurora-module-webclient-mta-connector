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
              <q-input outlined dense bg-color="white" v-model="memberEmail"/>
            </div>
            <div class="col-3 q-mt-xs q-ml-md">
              <q-btn unelevated no-caps no-wrap dense class="q-ml-md q-px-sm" :disable="!memberEmail.length" :ripple="false" color="primary"
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
          <div class="row items-center">
            <div class="col-2" v-t="'COREWEBCLIENT.LABEL_EMAIL'"></div>
            <div class="col-3">
              <q-input outlined dense bg-color="white" v-model="mailingListEmail"/>
            </div>
            <div class="q-ml-sm">@</div>
            <div class="col-3 q-ml-sm">
              <q-select outlined dense bg-color="white" v-model="currentDomain" :options="currentDomains">
                <template v-slot:selected>
                  <div class="ellipsis">{{ currentDomain.label }}</div>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pt-md text-right">
        <q-btn v-if="!createMode" unelevated no-caps dense class="q-px-sm" :ripple="false" color="negative"
               :label="deleting ? $t('MTACONNECTORWEBCLIENT.ACTION_DELETE_MAILINGLIST') : $t('MTACONNECTORWEBCLIENT.ACTION_DELETE_MAILINGLIST')" @click="deleteMailingList"/>
        <q-btn v-if="createMode" :disable="!mailingListEmail.length || !currentDomain" unelevated no-caps dense class="q-px-sm q-mr-sm" :ripple="false" color="primary"
               :label="creating ? $t('COREWEBCLIENT.ACTION_CREATE_IN_PROGRESS') : $t('COREWEBCLIENT.ACTION_CREATE')" @click="handleCreateMailingList"/>
        <q-btn v-if="createMode" unelevated no-caps dense class="q-px-sm" :ripple="false" color="secondary"
               :label="$t('COREWEBCLIENT.ACTION_CANCEL')" @click="cancel"/>
      </div>
    </div>
    <q-inner-loading style="justify-content: flex-start;" :showing="loading || saving || deleting">
      <q-linear-progress query />
    </q-inner-loading>
  </q-scroll-area>
</template>

<script>
import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import types from 'src/utils/types'
import webApi from 'src/utils/web-api'

import MailingListModel from '../../../MtaConnectorWebclient/vue/classes/Mailing'

export default {
  name: 'EditMailingList',

  props: {
    domains: Array,
    domain: Object
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
    }
  },

  watch: {
    $route () {
      this.parseRoute()
    }
  },

  beforeRouteLeave (to, from, next) {
    this.doBeforeRouteLeave(to, from, next)
  },

  beforeRouteUpdate (to, from, next) {
    this.doBeforeRouteLeave(to, from, next)
  },

  mounted () {
    this.parseRoute()
  },

  methods: {
    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges () {
      if (this.createMode) {
        return this.mailingListEmail !== ''
      } else {
        return this.memberEmail !== ''
      }
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges () {
      if (this.createMode) {
        this.mailingListEmail = ''
      } else {
        this.memberEmail = ''
      }
    },

    isMailingListEmailValid () {
      const invalidCharactersRegex = /[@\s]/
      return !invalidCharactersRegex.test(this.mailingListEmail) && this.mailingListEmail.length
    },

    handleCreateMailingList () {
      this.isMailingListEmailValid()
        ? this.createMailingList()
        : notification.showError(this.$t('ADMINPANELWEBCLIENT.ERROR_INVALID_EMAIL_USERNAME_PART'))
    },

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
            this.mailingListEmail = ''
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
        if (this.domain.value !== -1) {
          this.currentDomain = this.currentDomains.find(domain => {
            return domain.value === this.domain.value
          })
        } else {
          this.currentDomain = this.currentDomains[0]
        }
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
    addNewMember() {
      if (!this.saving) {
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
          notification.showError(this.$t('MTACONNECTORWEBCLIENT.ERROR_EMPTY_MEMBERS'))
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
