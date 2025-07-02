from odoo import api, fields, models


class Session(models.Model):
    _name = "auth.session"
    _description = "Session"

    session_token = fields.Char(string="Session Token", required=True)
    user_id = fields.Many2one("auth.user", string="User", required=True, ondelete='cascade')
    expires = fields.Datetime(string="Expires", required=True)