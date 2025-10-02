from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class NavFundConfig(models.Model):
    _name = 'nav.fund.config'
    _description = 'Cấu hình quỹ NAV'
    _rec_name = 'fund_id'
    _order = 'fund_id'

    # Thông tin cơ bản
    fund_id = fields.Many2one('portfolio.fund', string='Quỹ', required=True, ondelete='cascade')
    
    # Cấu hình tồn kho ban đầu
    initial_nav_price = fields.Float(
        string='Giá tồn kho ban đầu (NAV)', 
        required=True, 
        digits=(16, 2),
        help='Giá NAV ban đầu của quỹ'
    )
    
    initial_ccq_quantity = fields.Float(
        string='Số CCQ tồn kho ban đầu', 
        required=True, 
        digits=(16, 2),
        help='Số lượng CCQ tồn kho ban đầu'
    )
    
    capital_cost_percent = fields.Float(
        string='Chi phí vốn (%)', 
        required=True, 
        digits=(16, 4),
        help='Chi phí vốn tính theo phần trăm (ví dụ: 2.5 = 2.5%)'
    )
    
    # Thông tin bổ sung
    description = fields.Text(string='Mô tả')
    active = fields.Boolean(string='Kích hoạt', default=True)
    
    # Computed fields
    initial_total_value = fields.Float(
        string='Tổng giá trị ban đầu', 
        compute='_compute_initial_total_value', 
        store=True,
        digits=(16, 2)
    )
    
    
    @api.depends('initial_nav_price', 'initial_ccq_quantity')
    def _compute_initial_total_value(self):
        for record in self:
            record.initial_total_value = record.initial_nav_price * record.initial_ccq_quantity
    
    @api.onchange('fund_id')
    def _onchange_fund_id_set_initial_nav(self):
        """Khi chọn quỹ trên form, tự lấy giá NAV hiện tại từ quỹ nếu chưa nhập."""
        for record in self:
            if record.fund_id and not record.initial_nav_price:
                # lấy từ trường current_nav của quỹ, nếu không có thì 0.0
                record.initial_nav_price = record.fund_id.current_nav or 0.0
    
    # Constraints
    @api.constrains('initial_nav_price')
    def _check_initial_nav_price(self):
        for record in self:
            if record.initial_nav_price <= 0:
                raise ValidationError(_('Giá tồn kho ban đầu phải lớn hơn 0.'))
    
    @api.constrains('initial_ccq_quantity')
    def _check_initial_ccq_quantity(self):
        for record in self:
            if record.initial_ccq_quantity <= 0:
                raise ValidationError(_('Số CCQ tồn kho ban đầu phải lớn hơn 0.'))
    
    @api.constrains('capital_cost_percent')
    def _check_capital_cost_percent(self):
        for record in self:
            if record.capital_cost_percent < 0 or record.capital_cost_percent > 100:
                raise ValidationError(_('Chi phí vốn phải nằm trong khoảng 0% đến 100%.'))
    
    @api.constrains('fund_id')
    def _check_unique_fund(self):
        for record in self:
            if record.fund_id:
                duplicate = self.search([
                    ('fund_id', '=', record.fund_id.id),
                    ('id', '!=', record.id)
                ])
                if duplicate:
                    raise ValidationError(_('Cấu hình cho quỹ này đã tồn tại.'))
    
    @api.model
    def create(self, vals):
        """Nếu không truyền initial_nav_price, tự lấy từ quỹ để không cần seed trường này."""
        fund_id = vals.get('fund_id')
        missing_nav = ('initial_nav_price' not in vals) or (not vals.get('initial_nav_price'))
        if fund_id and missing_nav:
            fund = self.env['portfolio.fund'].browse(fund_id)
            vals['initial_nav_price'] = fund.current_nav or 0.0
        return super(NavFundConfig, self).create(vals)
    
    def write(self, vals):
        """Nếu thay đổi quỹ mà không truyền initial_nav_price, đồng bộ theo quỹ mới."""
        if 'fund_id' in vals and 'initial_nav_price' not in vals:
            fund = self.env['portfolio.fund'].browse(vals['fund_id'])
            vals['initial_nav_price'] = fund.current_nav or 0.0
        result = super(NavFundConfig, self).write(vals)
        try:
            # Chỉ đồng bộ vào bản ghi tồn kho ĐẦU TIÊN của quỹ (ngày nhỏ nhất), tránh ảnh hưởng các ngày sau
            impacted = any(k in vals for k in ['initial_nav_price', 'initial_ccq_quantity', 'capital_cost_percent', 'fund_id', 'active'])
            if impacted:
                for rec in self:
                    if not rec.active or not rec.fund_id:
                        continue
                    Inventory = self.env['nav.daily.inventory']
                    # Tìm ngày tồn kho nhỏ nhất của quỹ
                    first_inv = Inventory.search([
                        ('fund_id', '=', rec.fund_id.id)
                    ], order='inventory_date asc', limit=1)
                    if not first_inv:
                        # Chưa có tồn kho nào → chưa cần đồng bộ
                        continue
                    # Chỉ cập nhật nếu đang là bản ghi đầu tiên (hoặc cùng ngày với bản ghi đầu tiên) và còn draft
                    target_inventories = Inventory.search([
                        ('fund_id', '=', rec.fund_id.id),
                        ('inventory_date', '=', first_inv.inventory_date),
                        ('status', 'in', ['draft', 'confirmed'])
                    ])
                    for inv in target_inventories:
                        values_to_write = {}
                        if 'initial_ccq_quantity' in vals:
                            values_to_write['opening_ccq'] = rec.initial_ccq_quantity or 0.0
                        if 'initial_nav_price' in vals or 'fund_id' in vals:
                            values_to_write['opening_avg_price'] = rec.initial_nav_price or 0.0
                        if values_to_write:
                            inv.write(values_to_write)
                            try:
                                inv.force_recompute_all_fields()
                            except Exception:
                                inv._auto_calculate_inventory()
        except Exception:
            # Không chặn flow nếu đồng bộ tồn kho lỗi
            pass
        return result
    
    @api.model
    def get_fund_config(self, fund_id):
        """Lấy cấu hình quỹ theo ID"""
        config = self.search([
            ('fund_id', '=', fund_id),
            ('active', '=', True)
        ], limit=1)
        return config
    
    @api.model
    def create_or_update_fund_config(self, fund_id, initial_nav_price, initial_ccq_quantity, capital_cost_percent, description=''):
        """Tạo hoặc cập nhật cấu hình quỹ"""
        config = self.search([('fund_id', '=', fund_id)], limit=1)
        
        if config:
            config.write({
                'initial_nav_price': initial_nav_price,
                'initial_ccq_quantity': initial_ccq_quantity,
                'capital_cost_percent': capital_cost_percent,
                'description': description,
                'active': True
            })
        else:
            config = self.create({
                'fund_id': fund_id,
                'initial_nav_price': initial_nav_price,
                'initial_ccq_quantity': initial_ccq_quantity,
                'capital_cost_percent': capital_cost_percent,
                'description': description
            })
        
        return config
    
    @api.model
    def _create_default_fund_configs(self):
        """Tự động tạo cấu hình mặc định cho tất cả quỹ chưa có cấu hình"""
        try:
            # Lấy tất cả quỹ từ portfolio.fund
            funds = self.env['portfolio.fund'].search([])
            created_configs = []
            
            for fund in funds:
                # Kiểm tra xem đã có cấu hình chưa
                existing_config = self.search([('fund_id', '=', fund.id)], limit=1)
                
                if not existing_config:
                    # Tạo cấu hình mặc định
                    default_config = self.create({
                        'fund_id': fund.id,
                        'initial_nav_price': fund.current_nav or 1000.0,  # Sử dụng current_nav hoặc mặc định 1000
                        'initial_ccq_quantity': 1000.0,  # Mặc định 1000 CCQ
                        'capital_cost_percent': 1.9,  # Mặc định 1.9%
                        'description': f'Cấu hình mặc định cho quỹ {fund.name}',
                        'active': True
                    })
                    created_configs.append(default_config)
            
            return created_configs
        except Exception as e:
            # Log lỗi nhưng không crash
            import logging
            _logger = logging.getLogger(__name__)
            _logger.warning(f"Lỗi khi tạo cấu hình mặc định cho quỹ: {str(e)}")
            return []
    
    @api.model
    def get_or_create_fund_config(self, fund_id):
        """Lấy hoặc tạo cấu hình quỹ nếu chưa có"""
        config = self.get_fund_config(fund_id)
        
        if not config:
            # Tạo cấu hình mặc định
            fund = self.env['portfolio.fund'].browse(fund_id)
            if fund.exists():
                config = self.create({
                    'fund_id': fund_id,
                    'initial_nav_price': fund.current_nav or 1000.0,
                    'initial_ccq_quantity': 1000.0,
                    'capital_cost_percent': 1.9,
                    'description': f'Cấu hình mặc định cho quỹ {fund.name}',
                    'active': True
                })
        
        return config
