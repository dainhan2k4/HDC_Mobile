from odoo import api, fields, models


class VerificationToken(models.Model):
    _name = "auth.verification_token"
    _description = "Verification Token"

    identifier = fields.Char(string="Identifier", required=True)
    token = fields.Char(string="Token", required=True)
    expires = fields.Datetime(string="Expires", required=True)