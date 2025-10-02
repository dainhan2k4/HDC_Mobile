from odoo import models, fields

# Chứng chỉ quỹ
class FundCertificate(models.Model):
    _name = 'fund.certificate'
    _description = 'Fund Certificate'

    full_name = fields.Char(string="Tên quỹ đầy đủ", required=True)
    english_name = fields.Char(string="Tên quỹ tiếng Anh", required=True)
    short_name = fields.Char(string="Tên quỹ viết tắt", required=True)
    fund_color = fields.Char(string="Màu quỹ", required=True)
    current_nav = fields.Float(string="Giá NAV hiện tại", required=True)  # tài sản ròng trên mỗi chứng chỉ quỹ
    inception_date = fields.Datetime(string="Thời gian đóng sổ lệnh", required=True)
    closure_date = fields.Date(string="Ngày đóng sổ lệnh", required=True)
    receive_money_time = fields.Datetime(string="Thời điểm ghi nhận tiền vào quỹ", required=True)
    payment_deadline = fields.Integer(string="Thời hạn thanh toán bán (ngày)", required=True)
    redemption_time = fields.Integer(string="Thời gian ghi nhận lệnh Mua hoán đổi (ngày)", required=True)
    report_website = fields.Char(string="Website báo cáo quỹ", required=True)
    fund_type = fields.Selection([
        ('equity', 'Quỹ Cổ phiếu'),
        ('bond', 'Quỹ Trái phiếu'),
        ('mixed', 'Quỹ Hỗn hợp'),
    ], string='Chọn loại quỹ', required=True)  # gắn tạm giá trị
    risk_level = fields.Selection([
        ('1', '1 - Thấp nhất'),
        ('2', '2 - Thấp'),
        ('3', '3 - Trung bình'),
        ('4', '4 - Cao'),
        ('5', '5 - Rất cao'),  # gắn tạm giá trị
    ], string='Mức độ rủi ro', required=True)
    product_type = fields.Selection([
        ('open_ended', 'Quỹ mở'),
        ('close_ended', 'Quỹ đóng'),
    ], string="Loại sản phẩm", required=True)  # gắn tạm giá trị
    product_status = fields.Selection([
        ('active', 'Đang hoạt động'),
        ('inactive', 'Ngừng hoạt động')
    ], string="Trạng thái sản phẩm", required=True)  # gắn tạm giá trị
    fund_description = fields.Text(string="Mô tả quỹ", required=True)
    fund_image = fields.Binary(string="Hình ảnh của Quỹ")
    
    # Trường mới cho quỹ đóng
    initial_certificate_quantity = fields.Integer(string="Số lượng chứng chỉ quỹ đóng ban đầu", default=1000000)
    initial_certificate_price = fields.Float(string="Giá chứng chỉ quỹ ban đầu", default=10000.0)
    capital_cost = fields.Float(string="Chi phí vốn (%)", default=9.0, digits=(5, 2))

    monday = fields.Boolean(string="Thứ hai")
    tuesday = fields.Boolean(string="Thứ ba")
    wednesday = fields.Boolean(string="Thứ tư")
    thursday = fields.Boolean(string="Thứ năm")
    friday = fields.Boolean(string="Thứ sáu")
    saturday = fields.Boolean(string="Thứ bảy")
    sunday = fields.Boolean(string="Chủ nhật")


# Loại chương trình
class SchemeType(models.Model):
    _name = 'fund.scheme.type'
    _description = 'Fund Scheme Type'

    name = fields.Char(string="Tên Scheme", required=True)
    name_acronym = fields.Char(string="Tên Scheme (viết tắt)", required=True)
    scheme_code = fields.Char(string="Mã Scheme", required=True)
    auto_invest = fields.Boolean(string="Tự động mua")
    activate_scheme = fields.Boolean(string="Kích hoạt")
    first_transaction_fee = fields.Boolean(string="Tính phí theo giao dịch đầu tiên")
    scheme_ids = fields.One2many("fund.scheme", "scheme_type_id", string="Các chương trình")


# Chương trình
class Scheme(models.Model):
    _name = 'fund.scheme'
    _description = 'Fund Scheme'

    name = fields.Char(string="Tên chương trình", required=True)
    name_acronym = fields.Char(string="Tên viết tắt", required=True)
    transaction_code = fields.Char(string="Mã giao dịch", required=True)
    min_purchase_value = fields.Float(string="Giá trị mua tối thiểu", required=True)
    min_sell_quantity = fields.Float(string="Số lượng bán tối thiểu", required=True)
    min_conversion_quantity = fields.Float(string="Số lượng chuyển đổi tối thiểu", required=True)
    min_holding_quantity = fields.Float(string="Số lượng nắm giữ tối thiểu", required=True)
    select_fund_id = fields.Many2one("fund.certificate", string="Chọn quỹ",
                                     required=True)  # nhiều chương trình có thể chọn 1 quỹ -> link đến model chứng chỉ quỹ?
    scheme_type_id = fields.Many2one("fund.scheme.type", string="Chọn loại chương trình",
                                     required=True)  # nhiều chương trình có thể chọn 1 loại chương trình
    amc_fee = fields.Float(string="Phí AMC", required=True)
    fund_fee = fields.Float(string="Phí quỹ", required=True)
    active_status = fields.Selection([
        ('active', 'Kích hoạt'),
        ('inactive', 'Không kích hoạt'),
        ('pending', 'Chờ xử lý'),
        ('suspended', 'Tạm ngưng')
    ], string="Kích hoạt trạng thái", required=True)
    can_purchase = fields.Boolean(string="Được phép Mua?")
    can_sell = fields.Boolean(string="Được phép Bán?")
    can_convert = fields.Boolean(string="Được phép Chuyển đổi?")


# Biểu phí
class FeeSchedule(models.Model):
    _name = 'fund.fee.schedule'
    _description = 'Fund Fee Schedule'

    fee_name = fields.Char(string="Tên loại phí", required=True)
    fee_code = fields.Char(string="Mã phí VSD", required=True)
    fee_type = fields.Selection([
        ('subscription', 'Phí mua chứng chỉ quỹ'),
        ('redemption', 'Phí bán chứng chỉ quỹ'),
        ('switching', 'Phí chuyển đổi'),
        ('management', 'Phí quản lý'),
        ('performance', 'Phí thành công'),
        ('other', 'Phí khác')
    ], string="Loại phí", required=True)  # gắn tạm giá trị
    scheme_id = fields.Many2one("fund.scheme", string="Chương trình", required=True)
    operator_1 = fields.Selection([ ('+', '+'), ], string="Toán tử ban đầu", required=True)
    initial_value = fields.Float(string="Giá trị ban đầu", required=True)
    operator_2 = fields.Selection([ ('+', '+'), ], string="Toán tử kết thúc", required=True)
    end_value = fields.Char(string="Giá trị kết thúc", required=True)
    fee_rate = fields.Float(string="Tỉ lệ phí", required=True)
    activate = fields.Boolean(string="Kích hoạt")

#SIP
class SipSettings(models.Model):
    _name = 'fund.sip.settings'
    _description = 'SIP Settings'

    # sip_scheme = fields.Selection([], string="Chọn chương trình sip", required=True)
    sip_scheme_id = fields.Many2one('fund.scheme', string="Chọn chương trình SIP", required=True)
    max_non_consecutive_periods = fields.Integer(string="Số kỳ tối đa không liên tục", required=True)
    min_monthly_amount = fields.Float(string="Số tiền tối thiểu hằng tháng", required=True)
    min_maintenance_periods = fields.Integer(string="Số kỳ duy trì tối thiểu", required=True)
    cycle_code = fields.Char(string="Mã chu kỳ giao dịch", required=True)
    program_period = fields.Selection([
        ('monthly', 'Hàng tháng'),
        ('quarterly', 'Hàng quý'),
        ('yearly', 'Hàng năm'),
    ], string="Chọn kỳ của chương trình", required=True) #gắn tạm giá trị
    allow_multiple_investments = fields.Boolean(string="Cho phép đầu tư nhiều lần trong kỳ")
    active = fields.Boolean(string="Kích hoạt")


# Thuế
class TaxSettings(models.Model):
    _name = "fund.tax.settings"
    _description = "Tax Settings"

    tax_name = fields.Char(string="Tên Thuế", required=True)
    tax_english_name = fields.Char(string="Tên Tiếng Anh", required=True)
    tax_code = fields.Char(string="Mã Thuế", required=True)
    rate = fields.Float(string="Tỉ lệ đóng", required=True)
    active = fields.Boolean(string="Kích hoạt", default=True)