from odoo import models, fields


class Holiday(models.Model):
    _name = "data.holiday"
    _description = "Holiday"

    name = fields.Char(string="Tên ngày lễ", required=True)
    code = fields.Char(string="Mã ngày lễ", required=True)
    date = fields.Date(string="Ngày trong năm", required=True)
    value = fields.Char(string="Giá trị trong năm", required=True)
    active = fields.Boolean(string="Kích hoạt", default=True)


class Bank(models.Model):
    _name = "data.bank"
    _description = "Bank"

    name = fields.Char(string="Tên ngân hàng", required=True)
    english_name = fields.Char(string="Tiếng Tiếng Anh", required=True)
    short_name = fields.Char(string="Tên viết tắt", required=True)
    code = fields.Char(string="Mã giao dịch", required=True)
    swift_code = fields.Char(string="Swift Code", required=True)
    website = fields.Char(string="Website", required=True)
    active = fields.Boolean(string="Kích hoạt", default=True)


class BankBranch(models.Model):
    _name = "data.bank.branch"
    _description = "Bank Branch"

    name = fields.Char(string="Tên chi nhánh ngân hàng", required=True)
    bank_id = fields.Many2one("data.bank", string="Trực thuộc ngân hàng", required=True)
    code = fields.Char(string="Mã hành chính")
    active = fields.Boolean(string="Kích hoạt", default=True)


class Country(models.Model):
    _name = "data.country"
    _description = "Country"

    name = fields.Char(string="Tên quốc gia", required=True)
    english_name = fields.Char(string="Tên Tiếng Anh", required=True)
    code = fields.Char(string="Mã quốc gia", required=True)
    phone_code = fields.Char(string="Tên vùng điện thoại", required=True)
    postal_code = fields.Char(string="Mã bưu chính")
    vsd_code = fields.Char(string="Mã giao dịch VSD", required=True)
    sort_order = fields.Integer(string="Trọng số sắp xếp", required=True)
    active = fields.Boolean(string="Kích hoạt", default=True)


class City(models.Model):
    _name = "data.city"
    _description = "City"

    name = fields.Char(string="Tên Thành phố (Tỉnh)", required=True)
    english_name = fields.Char(string="Tên Tiếng Anh", required=True)
    country_id = fields.Many2one("data.country", string="Quốc gia", required=True)
    code = fields.Char(string="Mã hành chính", required=True)
    sort_order = fields.Integer(string="Trọng số sắp xếp", required=True)
    active = fields.Boolean(string="Kích hoạt", default=True)


class Ward(models.Model):
    _name = "data.ward"
    _description = "Ward"

    name = fields.Char(string="Tên Phường (Xã)", required=True)
    english_name = fields.Char(string="Tên Tiếng Anh", required=True)
    district = fields.Char(string="Quận (Huyện)", required=True)
    code = fields.Char(string="Mã hành chính")
    sort_order = fields.Integer(string="Trọng số sắp xếp", required=True)
    active = fields.Boolean(string="Kích hoạt", default=True)
