import json
import requests
import base64
import tempfile
import os
from odoo import http
from odoo.http import request, Response

class EKYCIntegrationController(http.Controller):
    
    # Configuration constants
    EKYC_BASE_URL = 'http://118.69.41.95:8000'
    EKYC_ENDPOINTS = {
        'front_ocr': '/api/ekyc/frontID',
        'back_ocr': '/api/ekyc/backID', 
        'detection': '/api/ekyc/detection',
        'process': '/api/ekyc-process'
    }
    REQUEST_TIMEOUT = 30
    PROCESS_TIMEOUT = 60
    REQUIRED_PORTRAIT_COUNT = 7
    
    def _make_secure_response(self, data, status=200):
        """Create standardized response with security headers"""
        return request.make_response(
            json.dumps(data),
            headers=[
                ('Content-Type', 'application/json'),
                ('X-Content-Type-Options', 'nosniff'),
                ('X-Frame-Options', 'DENY')
            ],
            status=status
        )
    
    def _make_success_response(self, data, message="Success"):
        """Create standardized success response"""
        return self._make_secure_response({
            'success': True,
            'message': message,
            'data': data
        })
    
    def _make_error_response(self, error_message, status=400):
        """Create standardized error response"""
        return self._make_secure_response({
            'success': False,
            'error': error_message
        }, status)
    
    def _make_ekyc_request(self, endpoint, files=None, data=None, timeout=None):
        """Make request to eKYC service with error handling"""
        try:
            url = f"{self.EKYC_BASE_URL}{endpoint}"
            timeout = timeout or self.REQUEST_TIMEOUT
            
            print(f"🔍 Making eKYC request to: {url}")
            
            response = requests.post(url, files=files, data=data, timeout=timeout)
            
            if not response.ok:
                print(f"❌ eKYC service error: {response.status_code} - {response.text}")
                raise Exception(f'eKYC service error: {response.status_code}')
            
            return response.json()
            
        except requests.exceptions.Timeout:
            print("❌ eKYC service timeout")
            raise Exception('eKYC service timeout. Vui lòng thử lại.')
        except requests.exceptions.ConnectionError:
            print("❌ eKYC service connection error")
            raise Exception('Không thể kết nối đến eKYC service. Vui lòng kiểm tra kết nối.')
        except Exception as e:
            print(f"❌ Unexpected error in eKYC request: {str(e)}")
            raise Exception(f'Lỗi xử lý eKYC: {str(e)}')
    
    def _validate_required_file(self, files, file_key, error_message):
        """Validate required file exists"""
        if file_key not in files:
            raise ValueError(error_message)
        return files[file_key]
    
    def _validate_required_param(self, form_data, param_key, error_message):
        """Validate required parameter exists"""
        value = form_data.get(param_key)
        if not value:
            raise ValueError(error_message)
        return value
    
    def _prepare_ekyc_files(self, request_files):
        """Prepare files for eKYC process"""
        files = {}
        if 'frontID' in request_files:
            files['frontID'] = request_files['frontID']
        
        portrait_images = request_files.getlist('portraitImages')
        if len(portrait_images) != self.REQUIRED_PORTRAIT_COUNT:
            raise ValueError(f'Cần đúng {self.REQUIRED_PORTRAIT_COUNT} ảnh khuôn mặt (3 chỉnh diện, 2 góc trái, 2 góc phải), nhận được {len(portrait_images)}')
        
        if not files.get('frontID'):
            raise ValueError('Thiếu ảnh CCCD mặt trước')
        
        # Prepare files in the correct format
        files_to_send = []
        files_to_send.append(('frontID', (files['frontID'].filename, files['frontID'], files['frontID'].mimetype)))
        
        for i, img in enumerate(portrait_images):
            files_to_send.append(('portraitImages', (f'face_{i+1}.jpg', img, img.mimetype)))
        
        return files_to_send
    
    def _validate_ekyc_results(self, data):
        """Validate eKYC verification results"""
        results = data.get('results', {})
        
        if not results.get('success', False):
            error_msg = results.get('error', 'Xác thực eKYC thất bại.')
            raise ValueError(error_msg)
        
        if not results.get('face_matching', False):
            raise ValueError('Xác thực eKYC thất bại: Khuôn mặt không khớp với CCCD.')
        
        return True
    
    @http.route('/get_countries', type='http', auth='user', methods=['GET'])
    def get_countries(self, **kwargs):
        """Get list of countries from Odoo"""
        try:
            # Get countries from Odoo
            countries = request.env['res.country'].sudo().search([])
            countries_data = []
            
            for country in countries:
                countries_data.append({
                    'id': country.id,
                    'name': country.name,
                    'code': country.code
                })
            
            print(f"📊 Countries loaded: {len(countries_data)} countries")
            
            return request.make_response(
                json.dumps(countries_data),
                headers=[('Content-Type', 'application/json')],
                status=200
            )
            
        except Exception as e:
            print(f"❌ Error loading countries: {e}")
            return request.make_response(
                json.dumps([]),
                headers=[('Content-Type', 'application/json')],
                status=500
            )
    
    @http.route('/ekyc_verification', type='http', auth='user', website=True)
    def ekyc_verification_page(self, **kwargs):
        """Render eKYC verification page"""
        return request.render('investor_profile_management.ekyc_verification_page')
    
    @http.route('/api/ekyc/frontID', type='http', auth='user', methods=['POST'], csrf=False)
    def ekyc_front_ocr(self, **kwargs):
        """Process OCR for front CCCD"""
        try:
            front_file = self._validate_required_file(
                request.httprequest.files, 
                'frontID', 
                'Thiếu ảnh CCCD mặt trước'
            )
            
            data = self._make_ekyc_request(
                self.EKYC_ENDPOINTS['front_ocr'], 
                files={'frontID': front_file}
            )
            
            print(f"📊 eKYC front OCR response: {data}")
            
            # Extract result data
            result_data = data.get('result', data)
            return self._make_success_response(result_data)
                
        except ValueError as e:
            return self._make_error_response(str(e), 400)
        except Exception as e:
            return self._make_error_response(f'Lỗi xử lý OCR: {str(e)}', 500)

    @http.route('/api/ekyc/backID', type='http', auth='user', methods=['POST'], csrf=False)
    def ekyc_back_ocr(self, **kwargs):
        """Process OCR for back CCCD"""
        try:
            back_file = self._validate_required_file(
                request.httprequest.files, 
                'backID', 
                'Thiếu ảnh CCCD mặt sau'
            )
            
            data = self._make_ekyc_request(
                self.EKYC_ENDPOINTS['back_ocr'], 
                files={'backID': back_file}
            )
            
            print(f"📊 eKYC back OCR response: {data}")
            
            # Extract result data
            result_data = data.get('result', data)
            return self._make_success_response(result_data)
                
        except ValueError as e:
            return self._make_error_response(str(e), 400)
        except Exception as e:
            return self._make_error_response(f'Lỗi xử lý OCR: {str(e)}', 500)

    @http.route('/api/ekyc/detection', type='http', auth='user', methods=['POST'], csrf=False)
    def ekyc_detection(self, **kwargs):
        """Process face orientation detection"""
        try:
            frame_file = self._validate_required_file(
                request.httprequest.files, 
                'frame', 
                'Thiếu ảnh khuôn mặt'
            )
            
            expected = self._validate_required_param(
                request.httprequest.form, 
                'expected', 
                'Thiếu tham số expected'
            )
            
            data = self._make_ekyc_request(
                self.EKYC_ENDPOINTS['detection'], 
                files={'frame': frame_file},
                data={'expected': expected}
            )
            
            return self._make_success_response(data)
                
        except ValueError as e:
            return self._make_error_response(str(e), 400)
        except Exception as e:
            return self._make_error_response(f'Lỗi xử lý detection: {str(e)}', 500)

    @http.route('/api/ekyc-process', type='http', auth='user', methods=['POST'], csrf=False)
    def ekyc_process(self, **kwargs):
        """Process eKYC verification with 7 portrait images"""
        try:
            print(f"🚀 Starting eKYC process endpoint")
            print(f"📋 Request files: {list(request.httprequest.files.keys())}")
            print(f"📋 Request form: {list(request.httprequest.form.keys())}")
            
            # Prepare files for eKYC
            files_to_send = self._prepare_ekyc_files(request.httprequest.files)
            
            # Send files to eKYC service
            data = self._make_ekyc_request(
                self.EKYC_ENDPOINTS['process'], 
                files=files_to_send,
                timeout=self.PROCESS_TIMEOUT
            )
            
            print(f"📊 eKYC service response: {data}")
            
            # Validate eKYC verification results
            self._validate_ekyc_results(data)
            
            # Return success response
            return self._make_success_response(data, 'Xác thực eKYC thành công')
                
        except ValueError as e:
            return self._make_error_response(str(e), 400)
        except Exception as e:
            return self._make_error_response(f'Lỗi xử lý eKYC: {str(e)}', 500)





 