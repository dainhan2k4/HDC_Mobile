from odoo import http
from odoo.http import request, Response
import json
import logging

_logger = logging.getLogger(__name__)


class PersonalProfileController(http.Controller):

    @http.route('/personal_profile', type='http', auth='user', website=True)
    def personal_profile_page(self, **kwargs):
        """Route để hiển thị trang personal profile widget"""
        return request.render('investor_profile_management.personal_profile_page')

    @http.route('/bank_info', type='http', auth='user', website=True)
    def bank_info_page(self, **kwargs):
        """Route to display the bank information widget page"""
        return request.render('investor_profile_management.bank_info_page')

    @http.route('/address_info', type='http', auth='user', website=True)
    def address_info_page(self, **kwargs):
        """Route to display the address information widget page"""
        return request.render('investor_profile_management.address_info_page')

    @http.route('/verification', type='http', auth='user', website=True)
    def verification_page(self, **kwargs):
        """Route to display the verification completion widget page"""
        return request.render('investor_profile_management.verification_page')

    @http.route('/get_countries', type='http', auth='user', methods=['GET'], csrf=False)
    def get_countries(self, **kwargs):
        """API endpoint để lấy danh sách quốc gia"""
        try:
            countries = request.env['res.country'].sudo().search([])
            data = []
            for country in countries:
                data.append({
                    'id': country.id,
                    'name': country.name
                })
            return Response(json.dumps(data), content_type='application/json')
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/get_currencies', type='http', auth='user', methods=['GET'], csrf=False)
    def get_currencies(self, **kwargs):
        """API endpoint để lấy danh sách tiền tệ"""
        try:
            currencies = request.env['res.currency'].sudo().search([])
            data = []
            for currency in currencies:
                data.append({
                    'id': currency.id,
                    'name': currency.name,
                    'symbol': currency.symbol
                })
            return Response(json.dumps(data), content_type='application/json')
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/get_status_info', type='http', auth='user', methods=['GET'], csrf=False)
    def get_status_info(self, **kwargs):
        """API endpoint để lấy dữ liệu status info của user hiện tại"""
        try:
            current_user = request.env.user
            status_infos = request.env['status.info'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ])
            
            data = []
            for status_info in status_infos:
                data.append({
                    'id': status_info.id,
                    'so_tk': status_info.so_tk or '',
                    'ma_gioi_thieu': status_info.ma_gioi_thieu or '',
                    'trang_thai_tk_dau_tu': status_info.trang_thai_tk_dau_tu or '',
                    'ho_so_goc': status_info.ho_so_goc or '',
                    'rm_id': status_info.rm_id.id if status_info.rm_id else '',
                    'rm_name': status_info.rm_id.name if status_info.rm_id else '',
                    'bda_id': status_info.bda_id.id if status_info.bda_id else '',
                    'bda_name': status_info.bda_id.name if status_info.bda_id else '',
                })
            
            return Response(json.dumps(data), content_type='application/json')
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/data_personal_profile', type='http', auth='user', methods=['GET'], csrf=False)
    def get_personal_profile_data(self, **kwargs):
        """API endpoint để lấy dữ liệu personal profile của user hiện tại"""
        try:
            # Lấy dữ liệu từ model investor.profile của user hiện tại
            current_user = request.env.user
            personal_profiles = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ])
            
            data = []
            if personal_profiles:
                # Nếu có profile, trả về dữ liệu profile
                for profile in personal_profiles:
                    id_front_url = ''
                    id_back_url = ''
                    if profile.id_front:
                        id_front_url = f"/web/image?model=investor.profile&field=id_front&id={profile.id}"
                    if profile.id_back:
                        id_back_url = f"/web/image?model=investor.profile&field=id_back&id={profile.id}"
                    data.append({
                        'id': profile.id,
                        'name': profile.name or '',
                        'email': profile.email or '',
                        'phone': profile.phone or '',
                        'birth_date': profile.birth_date.strftime('%Y-%m-%d') if profile.birth_date else '',
                        'gender': profile.gender or '',
                        'nationality': profile.nationality.id if profile.nationality else '',
                        'id_type': profile.id_type or '',
                        'id_number': profile.id_number or '',
                        'id_issue_date': profile.id_issue_date.strftime('%Y-%m-%d') if profile.id_issue_date else '',
                        'id_issue_place': profile.id_issue_place or '',
                        'id_front': id_front_url,
                        'id_back': id_back_url,
                    })
            else:
                # Nếu chưa có profile, trả về thông tin từ user hiện tại
                partner = current_user.partner_id
                data.append({
                    'id': None,
                    'name': partner.name or current_user.name or '',
                    'email': partner.email or current_user.email or '',
                    'phone': partner.phone or partner.mobile or '',
                    'birth_date': '',
                    'gender': '',
                    'nationality': '',
                    'id_type': '',
                    'id_number': '',
                    'id_issue_date': '',
                    'id_issue_place': '',
                    'id_front': '',
                    'id_back': '',
                })
            
            return Response(json.dumps(data), content_type='application/json')
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/save_personal_profile', type='http', auth='user', methods=['POST'], csrf=False)
    def save_personal_profile_data(self, **kwargs):
        """API endpoint để lưu dữ liệu personal profile"""
        try:
            current_user = request.env.user
            _logger.info(f"🔍 [PersonalProfile] Starting save for user: {current_user.name} (ID: {current_user.id})")
            
            # Parse JSON data
            data = json.loads(request.httprequest.data.decode('utf-8'))
            _logger.info(f"📊 [PersonalProfile] Received data keys: {list(data.keys())}")
            
            # Tìm profile hiện tại hoặc tạo mới
            profile = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ], limit=1)
            _logger.info(f"🔍 [PersonalProfile] Existing profile found: {bool(profile)}")
            
            if not profile:
                # Tạo profile mới với default values để tránh constraint error
                _logger.info("🆕 [PersonalProfile] Creating new profile with default values")
                partner = current_user.partner_id
                vietnam = request.env['res.country'].sudo().search([('code', '=', 'VN')], limit=1)
                
                profile_data = {
                    'partner_id': partner.id,
                    'name': partner.name or current_user.name or 'Chưa cập nhật',
                    'birth_date': '1990-01-01',
                    'gender': 'other',
                    'nationality': vietnam.id if vietnam else False,
                    'id_type': 'id_card',
                    'id_number': '000000000',  # Placeholder
                    'id_issue_date': '2020-01-01',
                    'id_issue_place': 'Chưa cập nhật',
                    'phone': partner.phone or '',
                    'email': partner.email or '',
                }
                
                _logger.info(f"📋 [PersonalProfile] Profile creation data: {profile_data}")
                
                try:
                    profile = request.env['investor.profile'].sudo().create(profile_data)
                    _logger.info(f"✅ [PersonalProfile] Profile created successfully with ID: {profile.id}")
                except Exception as create_error:
                    _logger.error(f"❌ [PersonalProfile] Failed to create profile: {create_error}")
                    raise
            
            # Cập nhật dữ liệu
            _logger.info("🔄 [PersonalProfile] Preparing update data")
            update_data = {}
            if 'name' in data:
                update_data['name'] = data['name']
            if 'email' in data:
                update_data['email'] = data['email']
            if 'phone' in data:
                update_data['phone'] = data['phone']
            if 'gender' in data:
                update_data['gender'] = data['gender']
            if 'nationality' in data and data['nationality']:
                update_data['nationality'] = int(data['nationality'])
            if 'birth_date' in data and data['birth_date']:
                update_data['birth_date'] = data['birth_date']
            if 'id_type' in data:
                update_data['id_type'] = data['id_type']
            if 'id_number' in data:
                update_data['id_number'] = data['id_number']
            if 'id_issue_date' in data and data['id_issue_date']:
                update_data['id_issue_date'] = data['id_issue_date']
            if 'id_issue_place' in data:
                update_data['id_issue_place'] = data['id_issue_place']
            
            _logger.info(f"📝 [PersonalProfile] Update data: {update_data}")
            
            # Cập nhật profile
            try:
                profile.sudo().write(update_data)
                _logger.info(f"✅ [PersonalProfile] Profile updated successfully for ID: {profile.id}")
            except Exception as update_error:
                _logger.error(f"❌ [PersonalProfile] Failed to update profile: {update_error}")
                raise

            # Đồng bộ lên contact/customer (res.partner)
            _logger.info("🔗 [PersonalProfile] Syncing with res.partner")
            partner_update = {}
            if 'name' in data:
                partner_update['name'] = data['name']
            if 'email' in data:
                partner_update['email'] = data['email']
            if 'phone' in data:
                partner_update['phone'] = data['phone']
                
            if partner_update:
                _logger.info(f"👤 [PersonalProfile] Partner update data: {partner_update}")
                try:
                    profile.partner_id.sudo().write(partner_update)
                    _logger.info(f"✅ [PersonalProfile] Partner synced successfully for ID: {profile.partner_id.id}")
                except Exception as partner_error:
                    _logger.error(f"❌ [PersonalProfile] Failed to sync partner: {partner_error}")
                    # Don't raise here - partner sync is not critical
            
            _logger.info("🎉 [PersonalProfile] Save operation completed successfully")
            return Response(json.dumps({'success': True, 'message': 'Profile updated successfully'}), 
                          content_type='application/json')
                          
        except Exception as e:
            _logger.error(f"💥 [PersonalProfile] Critical error in save operation: {str(e)}")
            _logger.error(f"💥 [PersonalProfile] Exception type: {type(e).__name__}")
            _logger.error(f"💥 [PersonalProfile] User: {request.env.user.name if request.env.user else 'Unknown'}")
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/upload_id_image', type='http', auth='user', methods=['POST'], csrf=False)
    def upload_id_image(self, **kwargs):
        try:
            current_user = request.env.user
            profile = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ], limit=1)
            if not profile:
                return Response(json.dumps({'error': 'Chưa có hồ sơ cá nhân'}), content_type='application/json', status=400)

            file = request.httprequest.files.get('file')
            side = request.httprequest.form.get('side')
            if not file or side not in ['front', 'back']:
                return Response(json.dumps({'error': 'Thiếu file hoặc side'}), content_type='application/json', status=400)

            file_data = file.read()
            filename = file.filename
            if side == 'front':
                profile.sudo().write({'id_front': file_data, 'id_front_filename': filename})
            else:
                profile.sudo().write({'id_back': file_data, 'id_back_filename': filename})

            return Response(json.dumps({'success': True}), content_type='application/json')
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/data_bank_info', type='http', auth='user', methods=['GET'], csrf=False)
    def get_bank_info_data(self, **kwargs):
        """API endpoint để lấy dữ liệu bank information của user hiện tại"""
        try:
            current_user = request.env.user
            
            # Tìm hoặc tạo investor profile trước
            profile = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ], limit=1)
            
            if not profile:
                # Tạo profile mới nếu chưa có
                profile = request.env['investor.profile'].sudo().create({
                    'partner_id': current_user.partner_id.id,
                })
            
            # Lấy dữ liệu từ model investor.bank.account của user hiện tại
            bank_accounts = request.env['investor.bank.account'].sudo().search([
                ('investor_id', '=', profile.id)
            ])

            data = []
            if bank_accounts:
                # Nếu có bank account, trả về dữ liệu
                for bank_account in bank_accounts:
                    data.append({
                        'id': bank_account.id,
                        'account_holder': bank_account.account_holder or '',
                        'account_number': bank_account.account_number or '',
                        'bank_name': bank_account.bank_name or '',
                        'branch': bank_account.branch or '',
                        'company_name': bank_account.company_name or '',
                        'company_address': bank_account.company_address or '',
                        'monthly_income': bank_account.monthly_income or '',
                        'occupation': bank_account.occupation or '',
                        'position': bank_account.position or ''
                    })
            else:
                # Nếu chưa có bank account, trả về thông tin mặc định
                partner = current_user.partner_id
                data.append({
                    'id': None,
                    'account_holder': partner.name or current_user.name or '',
                    'account_number': '',
                    'bank_name': '',
                    'branch': '',
                    'company_name': '',
                    'company_address': '',
                    'monthly_income': '',
                    'occupation': '',
                    'position': ''
                })

            return Response(json.dumps(data), content_type='application/json')
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/save_bank_info', type='http', auth='user', methods=['POST'], csrf=False)
    def save_bank_info_data(self, **kwargs):
        """API endpoint để lưu dữ liệu bank information"""
        try:
            current_user = request.env.user
            _logger.info(f"🏦 [BankInfo] Starting save for user: {current_user.name} (ID: {current_user.id})")
            data = json.loads(request.httprequest.data.decode('utf-8'))
            _logger.info(f"📊 [BankInfo] Received data keys: {list(data.keys())}")

            # Tìm hoặc tạo investor profile trước
            profile = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ], limit=1)

            if not profile:
                _logger.info("🆕 [BankInfo] Creating new investor profile")
                partner = current_user.partner_id
                vietnam = request.env['res.country'].sudo().search([('code', '=', 'VN')], limit=1)
                try:
                    profile = request.env['investor.profile'].sudo().create({
                        'partner_id': partner.id,
                        'name': partner.name or current_user.name or 'Chưa cập nhật',
                        'birth_date': '1990-01-01',
                        'gender': 'other',
                        'nationality': vietnam.id if vietnam else False,
                        'id_type': 'id_card',
                        'id_number': '000000000',
                        'id_issue_date': '2020-01-01',
                        'id_issue_place': 'Chưa cập nhật',
                        'phone': partner.phone or '',
                        'email': partner.email or '',
                    })
                    _logger.info(f"✅ [BankInfo] Profile created successfully with ID: {profile.id}")
                except Exception as create_error:
                    _logger.error(f"❌ [BankInfo] Failed to create profile: {create_error}")
                    raise

            # Tìm bank account hiện tại hoặc tạo mới
            bank_account = request.env['investor.bank.account'].sudo().search([
                ('investor_id', '=', profile.id)
            ], limit=1)

            if not bank_account:
                # Tạo bank account mới với investor_id
                bank_account = request.env['investor.bank.account'].sudo().create({
                    'investor_id': profile.id,
                })

            update_data = {}
            if 'account_holder' in data:
                update_data['account_holder'] = data['account_holder']
            if 'account_number' in data:
                update_data['account_number'] = data['account_number']
            if 'bank_name' in data:
                update_data['bank_name'] = data['bank_name']
            if 'branch' in data:
                update_data['branch'] = data['branch']
            if 'company_name' in data:
                update_data['company_name'] = data['company_name']
            if 'company_address' in data:
                update_data['company_address'] = data['company_address']
            if 'monthly_income' in data:
                update_data['monthly_income'] = data['monthly_income']
            if 'occupation' in data:
                update_data['occupation'] = data['occupation']
            if 'position' in data:
                update_data['position'] = data['position']
            
            bank_account.sudo().write(update_data)

            _logger.info("🎉 [BankInfo] Bank info save operation completed successfully")
            return Response(json.dumps({'success': True, 'message': 'Bank info updated successfully'}),
                          content_type='application/json')
        except Exception as e:
            _logger.error(f"💥 [BankInfo] Critical error in save operation: {str(e)}")
            _logger.error(f"💥 [BankInfo] Exception type: {type(e).__name__}")
            _logger.error(f"💥 [BankInfo] User: {request.env.user.name if request.env.user else 'Unknown'}")
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/data_address_info', type='http', auth='user', methods=['GET'], csrf=False)
    def get_address_info_data(self, **kwargs):
        """API endpoint để lấy dữ liệu address information của user hiện tại"""
        try:
            current_user = request.env.user
            
            # Tìm hoặc tạo investor profile trước
            profile = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ], limit=1)
            
            if not profile:
                # Tạo profile mới nếu chưa có với default values
                partner = current_user.partner_id
                vietnam = request.env['res.country'].sudo().search([('code', '=', 'VN')], limit=1)
                profile = request.env['investor.profile'].sudo().create({
                    'partner_id': partner.id,
                    'name': partner.name or current_user.name or 'Chưa cập nhật',
                    'birth_date': '1990-01-01',
                    'gender': 'other',
                    'nationality': vietnam.id if vietnam else False,
                    'id_type': 'id_card',
                    'id_number': '000000000',
                    'id_issue_date': '2020-01-01',
                    'id_issue_place': 'Chưa cập nhật',
                    'phone': partner.phone or '',
                    'email': partner.email or '',
                })
            
            # Lấy dữ liệu từ model investor.address của user hiện tại
            addresses = request.env['investor.address'].sudo().search([
                ('investor_id', '=', profile.id)
            ])

            data = []
            if addresses:
                # Nếu có address, trả về dữ liệu
                for address in addresses:
                    data.append({
                        'id': address.id,
                        'street': address.street or '',
                        'city': address.city or '',
                        'state': address.state_id.id if address.state_id else '',
                        'zip': address.zip or '',
                        'country_id': address.country_id.id if address.country_id else '',
                        'district': address.district or '',
                        'ward': address.ward or '',
                    })
            else:
                # Nếu chưa có address, trả về thông tin mặc định
                partner = current_user.partner_id
                data.append({
                    'id': None,
                    'street': partner.street or '',
                    'city': partner.city or '',
                    'state': partner.state_id.id if partner.state_id else '',
                    'zip': partner.zip or '',
                    'country_id': partner.country_id.id if partner.country_id else '',
                    'district': '',
                    'ward': '',
                })

            return Response(json.dumps(data), content_type='application/json')
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/save_address_info', type='http', auth='user', methods=['POST'], csrf=False)
    def save_address_info_data(self, **kwargs):
        """API endpoint để lưu dữ liệu address information"""
        try:
            current_user = request.env.user
            _logger.info(f"🏠 [AddressInfo] Starting save for user: {current_user.name} (ID: {current_user.id})")
            data = json.loads(request.httprequest.data.decode('utf-8'))
            _logger.info(f"📊 [AddressInfo] Received data keys: {list(data.keys())}")

            # Tìm hoặc tạo investor profile trước
            profile = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ], limit=1)

            if not profile:
                _logger.info("🆕 [AddressInfo] Creating new investor profile")
                partner = current_user.partner_id
                vietnam = request.env['res.country'].sudo().search([('code', '=', 'VN')], limit=1)
                try:
                    profile = request.env['investor.profile'].sudo().create({
                        'partner_id': partner.id,
                        'name': partner.name or current_user.name or 'Chưa cập nhật',
                        'birth_date': '1990-01-01',
                        'gender': 'other',
                        'nationality': vietnam.id if vietnam else False,
                        'id_type': 'id_card',
                        'id_number': '000000000',
                        'id_issue_date': '2020-01-01',
                        'id_issue_place': 'Chưa cập nhật',
                        'phone': partner.phone or '',
                        'email': partner.email or '',
                    })
                    _logger.info(f"✅ [AddressInfo] Profile created successfully with ID: {profile.id}")
                except Exception as create_error:
                    _logger.error(f"❌ [AddressInfo] Failed to create profile: {create_error}")
                    raise

            # Tìm address hiện tại hoặc tạo mới
            address = request.env['investor.address'].sudo().search([
                ('investor_id', '=', profile.id)
            ], limit=1)

            if not address:
                # Tạo address mới với investor_id
                address = request.env['investor.address'].sudo().create({
                    'investor_id': profile.id,
                })
            
            # Update address info
            address_vals = {
                'street': data.get('street'),
                'city': data.get('city'),
                'district': data.get('district'),
                'ward': data.get('ward'),
                'state_id': int(data.get('state')) if data.get('state') else False,
                'zip': data.get('zip'),
                'country_id': int(data.get('country_id')) if data.get('country_id') else False,
            }

            address.sudo().write(address_vals)
            
            _logger.info("🎉 [AddressInfo] Address info save operation completed successfully")
            return Response(json.dumps({'success': True, 'message': 'Address information updated successfully'}), 
                          content_type='application/json')
        except Exception as e:
            _logger.error(f"💥 [AddressInfo] Critical error in save operation: {str(e)}")
            _logger.error(f"💥 [AddressInfo] Exception type: {type(e).__name__}")
            _logger.error(f"💥 [AddressInfo] User: {request.env.user.name if request.env.user else 'Unknown'}")
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/data_verification', type='http', auth='user', methods=['GET'], csrf=False)
    def get_verification_data(self, **kwargs):
        """API endpoint để lấy dữ liệu verification của user hiện tại"""
        try:
            current_user = request.env.user
            verification_profiles = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ])

            data = []
            if verification_profiles:
                # Nếu có profile, trả về dữ liệu
                for profile in verification_profiles:
                    data.append({
                        'id': profile.id,
                        'is_verified': getattr(profile, 'is_verified', False), # Assuming a boolean field for verification status
                        'contract_email': profile.partner_id.email, # Assuming email for contract delivery is partner's email
                        'company_address': "Your Company Address Here", # Placeholder, update as needed
                    })
            else:
                # Nếu chưa có profile, trả về thông tin mặc định
                partner = current_user.partner_id
                data.append({
                    'id': None,
                    'is_verified': False,
                    'contract_email': partner.email or current_user.email or '',
                    'company_address': "Your Company Address Here",
                })

            return Response(json.dumps(data), content_type='application/json')
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

    @http.route('/save_all_profile_data', type='http', auth='user', methods=['POST'], csrf=False)
    def save_all_profile_data(self, **kwargs):
        """API endpoint to save all collected profile data"""
        try:
            current_user = request.env.user
            _logger.info(f"📋 [AllProfileData] Starting bulk save for user: {current_user.name} (ID: {current_user.id})")
            all_data = json.loads(request.httprequest.data.decode('utf-8'))
            _logger.info(f"📊 [AllProfileData] Data sections: {list(all_data.keys())}")

            # --- 1. Personal Profile Data ---
            personal_data = all_data.get('personalProfileData', {})
            profile = request.env['investor.profile'].sudo().search([
                ('partner_id', '=', current_user.partner_id.id)
            ], limit=1)

            if not profile:
                partner = current_user.partner_id
                vietnam = request.env['res.country'].sudo().search([('code', '=', 'VN')], limit=1)
                profile = request.env['investor.profile'].sudo().create({
                    'partner_id': partner.id,
                    'name': partner.name or current_user.name or 'Chưa cập nhật',
                    'birth_date': '1990-01-01',
                    'gender': 'other',
                    'nationality': vietnam.id if vietnam else False,
                    'id_type': 'id_card',
                    'id_number': '000000000',
                    'id_issue_date': '2020-01-01',
                    'id_issue_place': 'Chưa cập nhật',
                    'phone': partner.phone or '',
                    'email': partner.email or '',
                })
            
            personal_update_data = {}
            if 'name' in personal_data:
                personal_update_data['name'] = personal_data['name']
            if 'email' in personal_data:
                personal_update_data['email'] = personal_data['email']
            if 'phone' in personal_data:
                personal_update_data['phone'] = personal_data['phone']
            if 'gender' in personal_data:
                personal_update_data['gender'] = personal_data['gender']
            if 'nationality' in personal_data and personal_data['nationality']:
                personal_update_data['nationality'] = int(personal_data['nationality'])
            if 'birth_date' in personal_data and personal_data['birth_date']:
                personal_update_data['birth_date'] = personal_data['birth_date']
            if 'id_type' in personal_data:
                personal_update_data['id_type'] = personal_data['id_type']
            if 'id_number' in personal_data:
                personal_update_data['id_number'] = personal_data['id_number']
            if 'id_issue_date' in personal_data and personal_data['id_issue_date']:
                personal_update_data['id_issue_date'] = personal_data['id_issue_date']
            if 'id_issue_place' in personal_data:
                personal_update_data['id_issue_place'] = personal_data['id_issue_place']
            
            profile.sudo().write(personal_update_data)

            # Update res.partner with basic info (name, email, phone)
            partner_update = {}
            if 'name' in personal_data:
                partner_update['name'] = personal_data['name']
            if 'email' in personal_data:
                partner_update['email'] = personal_data['email']
            if 'phone' in personal_data:
                partner_update['phone'] = personal_data['phone']
            if partner_update:
                profile.partner_id.sudo().write(partner_update)

            # --- 2. Bank Account Data ---
            
            bank_data = all_data.get('bankInfoData', {})
            if bank_data:
                bank_account_vals = {
                    'bank_name': bank_data.get('bank_name'),
                    'account_number': bank_data.get('bank_account_number'),
                    'account_holder': bank_data.get('account_holder_name'),
                    'branch': bank_data.get('bank_branch'),
                    'company_name': bank_data.get('company_name'),
                    'company_address': bank_data.get('company_address'),
                    'occupation': bank_data.get('occupation'),
                    'monthly_income': bank_data.get('monthly_income'),
                    'position': bank_data.get('position'),
                }
                if profile.bank_account_ids:
                    profile.bank_account_ids[0].sudo().write(bank_account_vals)
                else:
                    bank_account_vals['investor_id'] = profile.id
                    request.env['investor.bank.account'].sudo().create(bank_account_vals)

            # --- 3. Address Information Data ---
            address_data = all_data.get('addressInfoData', {})
            if address_data:
                address_vals = {
                    'street': address_data.get('street'),
                    'city': address_data.get('city'), # Keep for now if there's a corresponding model field
                    'district': address_data.get('district'),
                    'ward': address_data.get('ward'),
                    'state_id': int(address_data.get('state')) if address_data.get('state') else False, # Mapping frontend 'state' to backend 'state_id'
                    'zip': address_data.get('zip'),
                    'country_id': int(address_data.get('country_id')) if address_data.get('country_id') else False, # Mapping frontend 'country_id' to backend 'country_id'
                }
                if profile.address_ids:
                    profile.address_ids[0].sudo().write(address_vals)
                else:
                    address_vals['investor_id'] = profile.id
                    request.env['investor.address'].sudo().create(address_vals)

            _logger.info("🎉 [AllProfileData] Bulk save operation completed successfully")
            return Response(json.dumps({'success': True, 'message': 'All profile data saved successfully'}), 
                          content_type='application/json')
        except Exception as e:
            _logger.error(f"💥 [AllProfileData] Critical error in bulk save operation: {str(e)}")
            _logger.error(f"💥 [AllProfileData] Exception type: {type(e).__name__}")
            _logger.error(f"💥 [AllProfileData] User: {request.env.user.name if request.env.user else 'Unknown'}")
            return Response(json.dumps({'error': str(e)}), content_type='application/json', status=500) 