#!/bin/sh
odoo -c /etc/odoo/odoo.conf -i base,asset_management,custom_auth,fund_management,investor_profile_management,overview_fund_management,transaction_management --without-demo=all