<template>
  <div>
    <div class="row q-mb-md" v-if="!createMode">
      <div class="col-1 q-my-sm" v-t="'COREWEBCLIENT.LABEL_EMAIL'"></div>
      <div class="col-5">
        <q-input outlined dense bg-color="white" v-model="publicId" :disable="!createMode" ref="publicId"
                 @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="!createMode">
      <div class="col-1 q-my-sm" v-t="'COREWEBCLIENT.LABEL_PASSWORD'"></div>
      <div class="col-5">
        <q-input outlined dense bg-color="white" v-model="password" ref="publicId" type="password"
                 autocomplete="new-password" @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="!createMode">
      <div class="col-1 q-my-sm" v-t="'MTACONNECTORWEBCLIENT.LABEL_QUOTA'"></div>
      <div class="col-5">
        <q-input outlined dense bg-color="white" v-model="quota" ref="publicId"
                 @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="createMode">
      <div class="col-1 q-my-sm" v-t="'COREWEBCLIENT.LABEL_EMAIL'"></div>
      <div class="col-3">
        <q-input outlined dense bg-color="white" v-model="publicId" ref="publicId" :disable="!createMode"
                 @keyup.enter="save"/>
      </div>
      <div class="col-3 q-ml-sm">
        <q-select outlined dense bg-color="white" v-model="selectedDomain"
                  emit-value map-options :options="domains" option-label="name"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="createMode">
      <div class="col-1 q-my-sm" v-t="'COREWEBCLIENT.LABEL_PASSWORD'"></div>
      <div class="col-3">
        <q-input outlined dense bg-color="white" v-model="password" ref="password" type="password"
                 autocomplete="new-password" @keyup.enter="save"/>
      </div>
    </div>
    <div class="row q-mb-md" v-if="createMode">
      <div class="col-1 q-my-sm" v-t="'MTACONNECTORWEBCLIENT.LABEL_QUOTA'"></div>
      <div class="col-3">
        <q-input outlined dense bg-color="white" v-model="quota" @keyup.enter="save"/>
      </div>
    </div>
  </div>
</template>

<script>
import cache from "../../../MailDomains/vue/cache";
import _ from "lodash";

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
      totalCount: 0,
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
        this.totalCount = 0
        cache.getDomains(this.currentTenantId).then(({ domains, totalCount, tenantId }) => {
          if (tenantId === this.currentTenantId) {
            this.domains = domains
            if (this.domains.length > 0) {
              this.selectedDomain = this.domains[0]
            }
            this.totalCount = totalCount
          }
        })
      }
    },
    save () {
      this.$emit('save')
    },
    hasChanges () {
      if (this.createMode) {
        return this.publicId !== '' || this.password !== '' || this.quota !== 0
      } else {
        return this.publicId !== this.user?.publicId  || this.password !== this.savedPass
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