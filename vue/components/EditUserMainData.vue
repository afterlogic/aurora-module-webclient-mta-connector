<template>
  <div>
    <div class="row q-mb-md" v-if="!createMode">
      <div class="col-2 q-my-sm" v-t="'COREWEBCLIENT.LABEL_EMAIL'"></div>
      <div class="col-5">
        <q-input outlined dense bg-color="white" v-model="publicId" :disable="!createMode"
                 @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="!createMode">
      <div class="col-2 q-my-sm" v-t="'COREWEBCLIENT.LABEL_PASSWORD'"></div>
      <div class="col-5">
        <!-- fake fields are a workaround to prevent auto-filling and saving passwords in Firefox -->
        <input style="display:none" type="text" name="fakeusernameremembered"/>
        <input style="display:none" type="password" name="fakepasswordremembered"/>
        <q-input outlined dense bg-color="white" v-model="password" type="password"
                 autocomplete="off" @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="!createMode">
      <div class="col-2 q-my-sm" v-t="'MTACONNECTORWEBCLIENT.LABEL_QUOTA'"></div>
      <div class="col-5">
        <q-input outlined dense bg-color="white" v-model="quotaMb"
                 @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md items-center" v-if="createMode">
      <div class="col-2" v-t="'COREWEBCLIENT.LABEL_EMAIL'"></div>
      <div class="col-3">
        <q-input outlined dense bg-color="white" v-model="publicId" :disable="!createMode"
                 @keyup.enter="save"/>
      </div>
      <div class="q-ml-sm">@</div>
      <div class="col-3 q-ml-sm">
        <q-select outlined dense bg-color="white" v-model="selectedDomain"
                  emit-value map-options :options="domains" option-label="name"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="createMode">
      <div class="col-2 q-my-sm" v-t="'COREWEBCLIENT.LABEL_PASSWORD'"></div>
      <div class="col-3">
        <!-- fake fields are a workaround to prevent auto-filling and saving passwords in Firefox -->
        <input style="display:none" type="text" name="fakeusernameremembered"/>
        <input style="display:none" type="password" name="fakepasswordremembered"/>
        <q-input outlined dense bg-color="white" v-model="password" type="password"
                 autocomplete="off" @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="createMode">
      <div class="col-2 q-my-sm" v-t="'MTACONNECTORWEBCLIENT.LABEL_QUOTA'"></div>
      <div class="col-3">
        <q-input outlined dense bg-color="white" v-model="quotaMb" @keyup.enter="save"/>
      </div>
    </div>
  </div>
</template>

<script>
import typesUtils from 'src/utils/types'

const FAKE_PASS = '     '

export default {
  name: 'EditMtaConnectorUserMainData',

  props: {
    user: Object,
    createMode: Boolean,
  },

  data() {
    return {
      publicId: '',
      password: FAKE_PASS,
      savedPass: FAKE_PASS,
      selectedDomain: null,
      quotaMb: '',
      mail: ''
    }
  },

  computed: {
    currentTenantId () {
      return this.$store.getters['tenants/getCurrentTenantId']
    },

    domains () {
      const allDomainLists = this.$store.getters['maildomains/getDomains']
      return typesUtils.pArray(allDomainLists[this.currentTenantId])
    }
  },

  watch: {
    $route() {
      this.populate()
    },

    user () {
      this.publicId = typesUtils.pString(this.user?.publicId)
      this.fillUpQuotaFromUser()
    },

    publicId () {
      this.changeStatusRequiredFields()
    },

    password () {
      this.changeStatusRequiredFields()
    },

    currentTenantId () {
      this.requestDomains()
    },
  },

  mounted () {
    this.requestDomains()
    this.populate()
    this.changeStatusRequiredFields()
  },

  methods: {
    requestDomains () {
      this.$store.dispatch('maildomains/requestDomainsIfNecessary', {
        tenantId: this.currentTenantId
      })
    },

    fillUpQuotaFromUser () {
      this.quotaMb = this.user?.quotaBytes > 0 ? Math.ceil(this.user?.quotaBytes / (1024 * 1024)) : ''
    },

    populate () {
      if (!this.createMode) {
        this.password = FAKE_PASS
        this.savedPass = FAKE_PASS
        this.publicId = typesUtils.pString(this.user?.publicId)
        this.fillUpQuotaFromUser()
      } else {
        this.publicId = ''
        this.password = ''
        this.savedPass = ''
        this.quotaMb = ''
        if (this.selectedDomain === null && this.domains.length > 0) {
          this.selectedDomain = this.domains[0]
        }
      }
    },

    save () {
      this.$emit('save')
    },

    changeStatusRequiredFields () {
      this.publicId.length && this.password.length
        ? this.$emit('changeStatusRequiredFields', true)
        : this.$emit('changeStatusRequiredFields', false)
    },

    /**
     * Method is used in the parent component
     */
    hasChanges () {
      if (this.createMode) {
        const bEmpty = this.publicId === '' && this.quotaMb === ''
        if (bEmpty) {
          return false
        } else {
          const bSamePublicId = this.user?.publicId === this.publicId + '@' + this.selectedDomain?.name
          const bSameQuota = this.user?.quotaBytes === typesUtils.pInt(this.quotaMb) * 1024 * 1024
          return !bSamePublicId || !bSameQuota
        }
      } else {
        const bSameQuota = this.user?.quotaBytes === typesUtils.pInt(this.quotaMb) * 1024 * 1024
        return !bSameQuota
      }
    },

    /**
     * Method is used in the parent component,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges () {
      if (this.createMode) {
        this.publicId = ''
        this.quotaMb = ''
      } else {
        this.fillUpQuotaFromUser()
      }
    },

    getSaveParameters () {
      return {
        PublicId: this.createMode ? this.publicId + '@' + this.selectedDomain?.name : this.user?.publicId,
        DomainId: this.selectedDomain?.id,
        QuotaBytes: typesUtils.pInt(this.quotaMb) * 1024 * 1024,
        Password: this.password
      }
    },
  }
}
</script>

<style scoped>

</style>
