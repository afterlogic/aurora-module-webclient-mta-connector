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
        <q-input outlined dense bg-color="white" v-model="quota"
                 @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="createMode">
      <div class="col-2 q-my-sm" v-t="'COREWEBCLIENT.LABEL_EMAIL'"></div>
      <div class="col-3">
        <q-input outlined dense bg-color="white" v-model="publicId" :disable="!createMode"
                 @keyup.enter="save"/>
      </div>
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
        <q-input outlined dense bg-color="white" v-model="quota" @keyup.enter="save"/>
      </div>
    </div>
  </div>
</template>

<script>
import cache from '../../../MailDomains/vue/cache'

const FAKE_PASS = '     '

export default {
  name: 'EditUserMainData1',
  props: {
    user: Object,
    createMode: Boolean,
    currentTenantId: Number,
  },
  data() {
    return {
      publicId: '',
      password: FAKE_PASS,
      savedPass: FAKE_PASS,
      domains: [],
      selectedDomain: null,
      quota: 0,
      mail: ''
    }
  },
  mounted () {
    this.populate()
  },
  watch: {
    $route() {
      this.populate()
    },
    user () {
      this.publicId = this.user?.publicId
      this.quota = this.user?.quotaBytes
    }
  },
  methods: {
    populate () {
      if (!this.createMode) {
        this.password = FAKE_PASS
        this.savedPas = FAKE_PASS
        this.publicId = this.user?.publicId
        this.quota = this.user?.quotaBytes
      } else {
        this.publicId = ''
        this.password = ''
        this.savedPas = ''
        this.domains = []
        cache.getDomains(this.currentTenantId).then(({ domains, totalCount, tenantId }) => {
          if (tenantId === this.currentTenantId) {
            this.domains = domains
            if (this.domains.length > 0) {
              this.selectedDomain = this.domains[0]
            }
          }
        })
      }
    },
    save () {
      this.$emit('save')
    },
    /**
     * Method is used in the parent component
     */
    hasChanges () {
      if (this.createMode) {
        return this.publicId !== '' || this.password !== '' || this.quota !== 0
      } else {
        return this.publicId !== this.user?.publicId || this.password !== this.savedPass
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
        this.password = ''
        this.quota = 0
      } else {
        this.publicId = this.user?.publicId
        this.password = this.savedPass
      }
    },

    getSaveParameters () {
      return {
        PublicId: this.createMode ? this.publicId + '@' + this.selectedDomain?.name : this.user?.publicId,
        DomainId: this.selectedDomain?.id,
        QuotaBytes: this.quota * 1024 * 1024,
        Password: this.password
      }
    },
  }
}
</script>

<style scoped>

</style>