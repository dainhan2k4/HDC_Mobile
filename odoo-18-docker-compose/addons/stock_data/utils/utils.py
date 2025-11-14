from odoo import api, models, _
from odoo.api import Environment, SUPERUSER_ID
from odoo.exceptions import UserError
import logging
import threading
from odoo import fields

_logger = logging.getLogger(__name__)


MARKET_MAP = {
    'DERIVATIVES': 'DER',
    'DER': 'DER',
    'HNX_BOND': 'HNXBOND',
    'HNXBOND': 'HNXBOND',
    'UPCOMS': 'UPCOM',
    'UPCOMBOARD': 'UPCOM',
}


def normalize_market(value: str) -> str:
    if not value:
        return ''
    val = (value or '').strip().upper()
    return MARKET_MAP.get(val, val)


class SdkConfigBuilder(models.AbstractModel):
    _name = 'ssi.sdk.config.builder'
    _description = 'SDK Config Builder'

    @api.model
    def build(self):
        cfg_rec = self.env['ssi.api.config'].get_config()
        if not cfg_rec:
            raise UserError(_("Không tìm thấy cấu hình SSI API đang kích hoạt. Vui lòng kiểm tra cấu hình SSI API."))
        
        if not cfg_rec.consumer_id or not cfg_rec.consumer_id.strip():
            raise UserError(_("Consumer ID không được để trống. Vui lòng kiểm tra cấu hình SSI API."))
        
        if not cfg_rec.consumer_secret or not cfg_rec.consumer_secret.strip():
            raise UserError(_("Consumer Secret không được để trống. Vui lòng kiểm tra cấu hình SSI API."))
        
        if not cfg_rec.api_url or not cfg_rec.api_url.strip():
            raise UserError(_("API URL không được để trống. Vui lòng kiểm tra cấu hình SSI API."))
        
        class Config:
            pass
        sdk_config = Config()
        sdk_config.consumerID = cfg_rec.consumer_id.strip()
        sdk_config.consumerSecret = cfg_rec.consumer_secret.strip()
        sdk_config.url = cfg_rec.api_url.strip()
        sdk_config.auth_type = 'Bearer'
        return sdk_config

    @staticmethod
    def build_config(cfg_rec):
        """Build sdk_config from a given config record (static for direct calls)."""
        if not cfg_rec:
            raise UserError(_("Không tìm thấy cấu hình SSI API. Vui lòng kiểm tra cấu hình SSI API."))
        
        consumer_id = getattr(cfg_rec, 'consumer_id', None) or ''
        consumer_secret = getattr(cfg_rec, 'consumer_secret', None) or ''
        api_url = getattr(cfg_rec, 'api_url', None) or ''
        
        if not consumer_id.strip():
            raise UserError(_("Consumer ID không được để trống. Vui lòng kiểm tra cấu hình SSI API."))
        
        if not consumer_secret.strip():
            raise UserError(_("Consumer Secret không được để trống. Vui lòng kiểm tra cấu hình SSI API."))
        
        if not api_url.strip():
            raise UserError(_("API URL không được để trống. Vui lòng kiểm tra cấu hình SSI API."))
        
        class Config:
            pass
        sdk_config = Config()
        sdk_config.consumerID = consumer_id.strip()
        sdk_config.consumerSecret = consumer_secret.strip()
        sdk_config.url = api_url.strip()
        sdk_config.auth_type = 'Bearer'
        return sdk_config


        


