from odoo import api, fields, models

class Account(models.Model):
    _name = "auth.account"
    _description = "Account"

    user_id = fields.Many2one("auth.user", string="User", required=True, ondelete='cascade')
    type = fields.Char(string="Type", required=True)
    provider = fields.Char(string="Provider", required=True)
    provider_account_id = fields.Char(string="Provider Account ID", required=True)
    refresh_token = fields.Char(string="Refresh Token")
    access_token = fields.Char(string="Access Token")
    expires_at = fields.Datetime(string="Expires At")
    token_type = fields.Char(string="Token Type")
    scope = fields.Char(string="Scope")
    id_token = fields.Char(string="ID Token")
    session_state = fields.Char(string="Session State")

    _sql_constraints = [
        ('account_provider_uniq', 'unique(provider, provider_account_id)', 'Provider and account ID must be unique.')
    ]
