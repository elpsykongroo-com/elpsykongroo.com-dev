<template>
    <el-dialog v-model=chartTable width="75%">
      <el-button type="primary" @click="openStatus()" >refresh</el-button>
      <Line ref="lineChart" v-if="loaded" :data=statuses :options="options"></Line>
    </el-dialog>
    <el-badge class="status" :is-dot=true type="success" @click="chartTable = true, openStatus()" v-if="healthDot">
      <el-icon><Coin/></el-icon>
    </el-badge>
    <el-badge class="status" :is-dot=true type="warning" @click="chartTable = true, openStatus()" v-if="!healthDot">
      <el-icon><Coin/></el-icon>
    </el-badge>
    <el-icon class="github" @click="openGithub()">     
      <Icon icon="grommet-icons:github" />
    </el-icon>
    <el-icon class="storage" @click="openStorage()"><UploadFilled /></el-icon>
    <el-badge class="chat" :is-dot=visible.isDotMessage>
      <el-icon  @click="openChat()"><ChatLineRound /></el-icon>
    </el-badge>
    <el-icon class="phoneMode" @click="qrcodeLogin" ><Iphone /></el-icon>
    <el-avatar class="whiteMode" :icon="UserFilled" size="small" @click="visible.webauthnFormVisible = true" v-if = "!access.sub"/>
    <el-avatar class="whiteMode" size="small" v-if = "access.sub" :src="access.avatarUrl" fit="fill" @click="openUser()"></el-avatar>
    <el-badge class="message" :is-dot=visible.isDot v-if="!access.sub">
      <el-icon @click="visible.noticeDrawer = true, noticeListByUser('', false)"><Message/></el-icon>
    </el-badge>
    <el-badge class="message" :is-dot=visible.isDot v-if="access.sub">
      <el-icon @click="visible.noticeDrawer = true, noticeListByUser(access.sub, false)"><Message/></el-icon>
    </el-badge>
    <el-dialog v-model="visible.webauthnFormVisible" width="65%">
      <el-form 
        v-loading=visible.loading
        :element-loading-text=visible.loadingText
        :element-loading-spinner="svg"
        element-loading-svg-view-box="-10, -10, 50, 50"
        element-loading-background="rgba(122, 122, 122, 0.8)"
        @keyup.enter.prevent="webauthnLogin()"
        label-position="left"
        label-width="auto" 
        :fit-input-width=true	>
        <el-form-item label="name" label-width="auto">
          <el-input v-model="access.username" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="visible.loading=false">cancel</el-button>
          <el-button @click="webauthnLogin(), visible.loadingText= 'logining...'">login</el-button>
          <el-button type="primary" @click="webauthnRegister(), visible.loadingText= 'registering...'" >
            register
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="userForm" :width=visible.dialogWidth>
      <el-button type="primary" @click="addAuthenticator()">add authenticator</el-button>
      <el-button type="primary" @click="loadUserInfo(username), visible.userInfoForm = true">userInfo</el-button>
      <el-form :model="userFormData">
        <el-form-item label="email" :label-width=visible.labelWidth :inline="true">
          <el-input v-model="userFormData.email"/>       
          <el-button type="primary" @click="validateEmail()" v-if="!access.email_verified && userFormData.email != 'null'">validate</el-button>
        </el-form-item>
        <el-form-item label="nickName" :label-width=visible.labelWidth>
          <el-input v-model="userFormData.nickName" />
        </el-form-item>
        <el-form-item label="password" :label-width=visible.labelWidth>
          <el-input v-model="userFormData.password" />
        </el-form-item>
        <el-form-item label="avatar" :label-width=visible.labelWidth>
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :http-request="uploadAvatar"
          >
            <img v-if="imageUrl" :src="imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item> 
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userForm = false">Cancel</el-button>
          <el-button type="primary" @click="updateUser(userFormData, access.sub)" >
            Confirm
          </el-button>
          <el-button type="danger" @click="logout()" >
            logout
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="visible.userInfoForm" :width=visible.dialogWidth>
      <el-button type="" @click="claimForm = true">Add</el-button>
      <el-form :model="dynamicClaimForm" >
        <el-form-item v-for="(value, key) in dynamicClaimForm"
          :key="key"
          :label="key"
          :label-width=visible.labelWidth> 
              <el-input v-model="dynamicClaimForm[key]" />
              <el-button size="small" type="danger" v-if='!(Object.keys(userInfoTableData).indexOf(key) >= 0)' @click="deleteClaim(key)">  
                delete
              </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="visible.userInfoForm = false">Cancel</el-button>
          <el-button type="primary" @click="updateUserInfo('')" >Confirm</el-button>
          <el-button type="primary" @click="resetUseInfo(userInfoTableData.username)" >Reset</el-button> 
        </span>
      </template>
    </el-dialog>
    <el-dialog v-model="claimForm" :width=visible.dialogWidth>
      <el-form>
        <el-form-item label="claimName" :label-width="visible.labelWidth">
          <el-input v-model="claimFormData.key" />
        </el-form-item>
        <el-form-item label="value" :label-width="visible.labelWidth">
          <el-input v-model="claimFormData.value"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="claimForm = false">Cancel</el-button>
          <el-button type="primary" @click="addClaim()" >Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  <el-dialog
    v-model="visible.tmpLogin"
    :width=visible.dialogWidth
    align-center>
    <span>send email to add authenticator for new Device?</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible.tmpLogin = false">Cancel</el-button>
        <el-button type="primary" @click="tmpLogin()">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog
    v-model="visible.refreshlogin"
    :width=visible.dialogWidth
    align-center>
    <span>redirect to refresh access?</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible.refreshlogin = false">later</el-button>
        <el-button type="primary" @click="refreshlogin(access.sub)">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog 
    v-model="visible.qrcode"
    :width=visible.dialogWidth>
    <QrcodeVue :value=access.qrcodeUrl :size="200" level="H" /> 
  </el-dialog>
  <Chat></Chat>
  <Notice></Notice>
  <Storage ref="storage"></Storage>

</template>

<script lang="ts" setup >
import { Iphone, Message, UploadFilled, UserFilled, Plus, Coin, ChatLineRound } from '@element-plus/icons-vue';
import { webauthnRegister, webauthnLogin, tmpLogin, logout, qrcodeLogin } from '~/assets/ts/login';
import { access } from '~/assets/ts/access';
import { visible } from "~/assets/ts/visible";
import { env } from '~/assets/ts/env';
import { axios } from '~/assets/ts/axio';
import * as webauthnJson from "@github/webauthn-json";
import { dayjs, ElLoading, ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import QrcodeVue from 'qrcode.vue';
import { refreshlogin } from '~/assets/ts/login';
import { loadUser, noticeListByUser, updateUser, loadUserInfo} from '~/assets/ts/commonApi';
import { userFormData, dynamicClaimForm, userInfoTableData, inituserInfoTable,} from '~/assets/ts/dataInterface'
import Notice from '~/components/api/Notice.vue';
import Storage from '~/components/api/Storage.vue';
import Chat from '~/components/api/Chat.vue';
import { Icon } from '@iconify/vue';
import { usePeerStore } from '~/assets/ts/webrtc';

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Colors 
} from 'chart.js'
import { Line, ChartComponentRef } from 'vue-chartjs'
const lineChart = ref<ChartComponentRef | null>(null);

ChartJS.register(  
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors)

function openChat() {
  if (!visible.isDotMessage) {
    visible.chatTable = true;
  } else {
    visible.chatDrawer = true;
    visible.isDotMessage = false;
  }
  const peerStore = usePeerStore();
  peerStore.initPeer();
}

const healthCheck = () => {
    const option = {
        baseURL: env.apiUrl,
        url: "/public/ip",
        method: "GET",
        headers: {
         
        }, 
    } 
    axios(option).then(function(response) {
      if (response.status == 200) {
        healthDot.value = true
      } else {
        healthDot.value = false
        const currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss Z")
        let param = {}
        if (response.status == undefined) {
          param[currentTime] = "500"
        } else {
          param[currentTime] = response.status
        }
        const option = {
          baseURL: env.statusUrl,
          url: "/status",
          method: "PUT",
          headers: {
            'Authorization': 'Bearer '+ access.access_token,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          params: param,
        }  
        axios(option).then(function(response) {

        })
      }
    }).catch(function(error) {
      healthDot.value = false
    })
}

window.onload = function () {
  healthCheck();
  setInterval(() => {
    healthCheck()
  }, env.healthCheckDuration * 1000)
}

const openGithub = () => {
  window.open(env.githubUrl, "_blank");
}

const storage = ref<InstanceType<typeof Storage> | null>(null)
const healthDot = ref(false)
const imageUrl = ref('')
const username = ref("")
const userForm = ref(false)
const claimForm = ref(false);
const chartTable = ref(false)
const loaded = ref(false)
const options = {
  responsive: true,
  plugins: {
    title: {
        display: true,
        text: 'downtime'
    },
    legend: {
      display: false
    
    }
  } 
}
let initStatusData  = () => ({
  datasets: [{
    data: [{}]
  }]
})

let statuses = reactive(initStatusData()); 

const openStatus = async() => {
  loaded.value = false
  Object.assign(statuses, initStatusData());
  const option = {
      baseURL: env.statusUrl,
      url: "/status",
      method: "GET",
      params: {
        limit: 30
      },
      headers: {
        'Authorization': 'Bearer '+ access.access_token
      }, 
  }  
  await axios(option).then(async function(response) {
      statuses.datasets[0].data = response.data
      lineChart.value?.chart?.update()
  })
  loaded.value = true

}

const initclaimFormData = () => ({
  key: "",
  value: ""
})

let claimFormData = reactive(initclaimFormData());
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `

const openStorage = () => {
  storage.value?.initS3();
}

const uploadAvatar = async (options: UploadRequestOptions) => {
  const option = {
      baseURL: env.storageUrl,
      url: "/storage/object",
      method: "POST",
      data: {
          data: options.file,
          bucket: access.sub,
          mode: "stream",
          idToken: access.id_token,
      },
      headers: {
          'Authorization': 'Bearer '+ access.access_token,
          "Content-Type": "multipart/form-data"
      }
  }
  axios(option);
}

const handleAvatarSuccess: UploadProps['onSuccess'] = async(
  response,
  uploadFile
) => {
  const userInfo = await loadUserInfo(access.sub);
  userInfo["picture"] = uploadFile.name
  userInfo["username"] = access.sub
  updateUserInfo(userInfo)  
  imageUrl.value = URL.createObjectURL(uploadFile.raw!)
  ElMessage.info('Avatar will update after next login')

}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type == "image/jpeg" || rawFile.type == "image/gif" || rawFile.type == "image/png") {
    if (rawFile.size / 1024 / 1024 > 10) {
      ElMessage.error('Avatar picture size can not exceed 10MB!')
      return false
    }
  } else {
    ElMessage.error('not support ' + rawFile.type)
    return false
  }
  return true
}

const openUser = async() => {
  const loadingInstance = ElLoading.service({ fullscreen: true })
  const currentUser = await loadUser()
  nextTick(() => {
    loadingInstance.close()
  })
  if (currentUser == "" || currentUser == undefined) {
    ElMessageBox.alert("load user error, please try again later")
    return
  }
  userFormData.email = currentUser.email
  userFormData.nickName = currentUser.nickName
  userFormData.password = currentUser.password
  username.value = currentUser.username
  userForm.value = true
}

const validateEmail = () => {
  const option = {
      baseURL: env.authUrl,
      url: "/email/verify" ,
      method: "POST",
      data: {
        username: access.sub
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        'Authorization': 'Bearer '+ access.access_token
      },
  }
  axios(option)
}

const addAuthenticator = () => {
  const option = {
    baseURL: env.authUrl,
    url: "authenticator/add",
    method: "POST",
    data: {
      username: access.sub
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      'Authorization': 'Bearer '+ access.access_token
    },
  }
  axios(option).then(async function (response) {
    const publicKeyCredential = await webauthnJson.create(response.data);
    const finishOption = {
        baseURL: env.authUrl,
        url: "/finishAuth",
        method: "POST",
        data: {
            credname: access.sub,
            username: access.sub,
            credential: JSON.stringify(publicKeyCredential),
        },
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            // "Access-Control-Allow-Origin": "*",
            // "Access-Control-Allow-Credentials": "true"
        }, 
        withCredentials: true                        
    }
    axios(finishOption).then(function (response) { 
      if (response.data == 200) {
            ElNotification({
                title: 'add authenticator success',
                message: 'please logout and login again',
                duration: 5000,
            })
        }    
      })
  })
}

const updateUserInfo = (userInfo) => {
  const newclaimMap = new Map<string, object>();
  for (let key in dynamicClaimForm.value) { 
    if(Object.keys(userInfoTableData).indexOf(key) >= 0 && key != "claim" && key != "username") {
      userInfoTableData[key] = dynamicClaimForm.value[key]
    } else if (key != "claims" && dynamicClaimForm.value.hasOwnProperty(key)) {
      newclaimMap.set(key, dynamicClaimForm.value[key])
    }
  }
  userInfoTableData.claims = JSON.stringify(Object.fromEntries(newclaimMap));
  const option = {
      baseURL: env.authUrl,
      url: "auth/user/info",
      method: "POST",
      data: userInfoTableData,
      headers: {
        'Authorization': 'Bearer '+ access.access_token,
        'Content-Type': 'application/json'
      },
  }
  if (userInfo != "") {
     option["data"] = userInfo
  }  
  axios(option).then(function(response){
    if(response.status == 200) {
      visible.userInfoForm = false;
    }
  })
}

const addClaim = () => {
  dynamicClaimForm.value[claimFormData.key] = claimFormData.value;
  claimForm.value = false;
}

const deleteClaim = (rmkey:string) => {
  const claimMap = new Map<string, object>();
  if(Object.keys(userInfoTableData).indexOf(rmkey) >= 0) {
      ElMessageBox.alert("unable to delete default claim")
  } else { 
    for (var key in dynamicClaimForm.value) { 
      if (key == rmkey) {
        delete dynamicClaimForm.value[rmkey];
      }
      if(Object.keys(userInfoTableData).indexOf(key) >= 0 && key != "claim") {
        userInfoTableData[key] = dynamicClaimForm.value[key]
        // if("true" == dynamicClaimForm.value[key]) {
        //   userInfoTableData[key] = true
        // } else if ("false" == dynamicClaimForm.value[key]) {
        //   userInfoTableData[key] = false
        // } 
      } else if (key != "claims" && dynamicClaimForm.value.hasOwnProperty(key) ) {
        claimMap.set(key, dynamicClaimForm.value[key])
      }
    }
    userInfoTableData.claims  = JSON.stringify(Object.fromEntries(claimMap));
    // for (var key in claimMapJson) {
    //   if (key = "_rawValue") {
    //     userInfoFormData.claims = claimMapJson[key]
    //   }
    //}
    const option = {
      baseURL: env.authUrl,
      url: "auth/user/info",
      method: "POST",
      data: userInfoTableData,
      headers: {
        'Authorization': 'Bearer '+ access.access_token,
        'Content-Type': 'application/json'
      },
    }
    axios(option).then(function(response){
      if (response.status == 200) {
        ElMessageBox.alert("delete success")
      }
    })
  }
}

const resetUseInfo = (username:string) => {
  dynamicClaimForm.value = inituserInfoTable()
  Object.assign(dynamicClaimForm, inituserInfoTable());
  Object.assign(userInfoTableData, inituserInfoTable());
  userInfoTableData.username = username;
}
</script>

<style scoped>
 .phoneMode {
    position:absolute;right: 50px; top:15px;
    color: #409EFF;
  }
  .whiteMode {
    position:absolute;right: 10px; top:10px;
  }
  .message {
    position:absolute;right: 80px; top:15px;
    color: #409EFF;
  }
  .storage {
    position:absolute;right: 110px; top:15px;
    color: #409EFF;
  }

  .github {
    position:absolute;right: 140px; top:15px;
    color: #409EFF;
  }

  .status {
    position:absolute;right: 170px; top:15px;
    color: #409EFF;
  }

  .chat {
    position:absolute;right: 200px; top:15px;
    color: #409EFF;
  }

  .avatar-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
  }

  .avatar-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
  }

  .el-icon.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 78px;
    height: 78px;
    text-align: center;
  }
  .avatar-uploader .avatar {
    width: 78px;
    height: 78px;
    display: block;
  }
</style>