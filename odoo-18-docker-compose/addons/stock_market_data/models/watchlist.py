# -*- coding: utf-8 -*-
from odoo import fields, models


class WatchlistData(models.Model):
    _name = "watchlist.data"
    _description = "Watchlist Data"
    _rec_name = "name"

    name = fields.Char(string="Name", required=True)
    symbol = fields.Many2many("nifty.totalmarket", string="")
    color = fields.Integer("Color Index", default=0)
    priority = fields.Selection(
        [("Medium", "Medium"), ("High", "High"), ("Very High", "Very High")],
        string="Priority",
    )
    stage_id = fields.Many2one(
        "crm.stage",
        string="Stage",
        index=True,
        tracking=True,
        readonly=False,
        store=True,
        copy=False,
    )
