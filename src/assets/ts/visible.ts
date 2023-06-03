import { reactive } from 'vue'

export const visible = reactive(
{
    "webauthnFormVisible": false,
    "authFormVisible": false,
    "loading": false,
    "tmpLogin": false,
    "qrcode": false,
    "userInfoForm": false,
    "ipFormLabelWidth": "100px",
    "userFormLabelWidth": "100px",
    "groupFormLabelWidth": "100px",
    "authorityFormLabelWidth": "100px",
    "authClientFormWidth": "100px",
    "authClientRegisterFormWidth": "100px",
    "width": window.innerWidth
})