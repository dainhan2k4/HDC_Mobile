from odoo import api, fields, models


class User(models.Model):
    _name = "auth.user"
    _description = "User"

    id = fields.Char(string="ID", required=True)
    name = fields.Char(string="Name")
    email = fields.Char(string="Email", required=True)
    email_verified = fields.Datetime(string="Email Verified")
    image = fields.Char(string="Image")
