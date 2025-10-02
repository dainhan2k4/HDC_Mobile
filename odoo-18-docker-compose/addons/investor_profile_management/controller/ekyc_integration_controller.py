import json
import requests
import base64
import tempfile
import os
from odoo import http
from odoo.http import request, Response

class EKYCIntegrationController(http.Controller):
    
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
            if 'frontID' not in request.httprequest.files:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Thiếu ảnh CCCD mặt trước'}),
                    headers=[('Content-Type', 'application/json')],
                    status=400
                )
            
            front_file = request.httprequest.files['frontID']
            
            # eKYC service URL
            flask_url = 'http://host.docker.internal:8000/api/ekyc/frontID'
            
            # Send file to eKYC service
            resp = requests.post(flask_url, files={'frontID': front_file}, timeout=30)
            
            if not resp.ok:
                return request.make_response(
                    json.dumps({'success': False, 'error': f'eKYC service error: {resp.status_code}'}),
                    headers=[('Content-Type', 'application/json')],
                    status=500
                )
            
            data = resp.json()
            print(f"📊 eKYC front OCR response: {data}")
            
            # eKYC service returns {"result": data}, so we need to extract the result
            if 'result' in data:
                return request.make_response(
                    json.dumps({
                        'success': True,
                        'data': data['result']
                    }),
                    headers=[('Content-Type', 'application/json')],
                    status=200
                )
            else:
                return request.make_response(
                    json.dumps({
                        'success': True,
                        'data': data
                    }),
                    headers=[('Content-Type', 'application/json')],
                    status=200
                )
                
        except Exception as e:
            return request.make_response(
                json.dumps({'success': False, 'error': f'Lỗi xử lý OCR: {str(e)}'}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )

    @http.route('/api/ekyc/backID', type='http', auth='user', methods=['POST'], csrf=False)
    def ekyc_back_ocr(self, **kwargs):
        """Process OCR for back CCCD"""
        try:
            if 'backID' not in request.httprequest.files:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Thiếu ảnh CCCD mặt sau'}),
                    headers=[('Content-Type', 'application/json')],
                    status=400
                )
            
            back_file = request.httprequest.files['backID']
            
            # eKYC service URL
            flask_url = 'http://host.docker.internal:8000/api/ekyc/backID'
            
            # Send file to eKYC service
            resp = requests.post(flask_url, files={'backID': back_file}, timeout=30)
            
            if not resp.ok:
                return request.make_response(
                    json.dumps({'success': False, 'error': f'eKYC service error: {resp.status_code}'}),
                    headers=[('Content-Type', 'application/json')],
                    status=500
                )
            
            data = resp.json()
            print(f"📊 eKYC back OCR response: {data}")
            
            # eKYC service returns {"result": data}, so we need to extract the result
            if 'result' in data:
                return request.make_response(
                    json.dumps({
                        'success': True,
                        'data': data['result']
                    }),
                    headers=[('Content-Type', 'application/json')],
                    status=200
                )
            else:
                return request.make_response(
                    json.dumps({
                        'success': True,
                        'data': data
                    }),
                    headers=[('Content-Type', 'application/json')],
                    status=200
                )
                
        except Exception as e:
            return request.make_response(
                json.dumps({'success': False, 'error': f'Lỗi xử lý OCR: {str(e)}'}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )

    @http.route('/api/ekyc/detection', type='http', auth='user', methods=['POST'], csrf=False)
    def ekyc_detection(self, **kwargs):
        """Process face orientation detection"""
        try:
            if 'frame' not in request.httprequest.files:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Thiếu ảnh khuôn mặt'}),
                    headers=[('Content-Type', 'application/json')],
                    status=400
                )
            
            frame_file = request.httprequest.files['frame']
            expected = request.httprequest.form.get('expected')
            
            if not expected:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Thiếu tham số expected'}),
                    headers=[('Content-Type', 'application/json')],
                    status=400
                )
            
            # eKYC service URL
            flask_url = 'http://host.docker.internal:8000/api/ekyc/detection'
            
            # Send file and expected parameter to eKYC service
            form_data = {'expected': expected}
            files = {'frame': frame_file}
            
            resp = requests.post(flask_url, files=files, data=form_data, timeout=30)
            
            if not resp.ok:
                return request.make_response(
                    json.dumps({'success': False, 'error': f'eKYC service error: {resp.status_code}'}),
                    headers=[('Content-Type', 'application/json')],
                    status=500
                )
            
            data = resp.json()
            return request.make_response(
                json.dumps(data),
                headers=[('Content-Type', 'application/json')],
                status=200
            )
                
        except Exception as e:
            return request.make_response(
                json.dumps({'success': False, 'error': f'Lỗi xử lý detection: {str(e)}'}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )

    @http.route('/api/ekyc-process', type='http', auth='user', methods=['POST'], csrf=False)
    def ekyc_process(self, **kwargs):
        """Process eKYC verification with 7 portrait images"""
        try:
            print(f"🚀 Starting eKYC process endpoint")
            print(f"📋 Request files: {list(request.httprequest.files.keys())}")
            print(f"📋 Request form: {list(request.httprequest.form.keys())}")
            # Get uploaded files
            files = {}
            if 'frontID' in request.httprequest.files:
                files['frontID'] = request.httprequest.files['frontID']
            
            # Get portrait images
            portrait_images = request.httprequest.files.getlist('portraitImages')
            print(f"🔍 DEBUG: Received {len(portrait_images)} portrait images")
            
            if len(portrait_images) != 7:
                return request.make_response(
                    json.dumps({'success': False, 'error': f'Cần đúng 7 ảnh khuôn mặt (3 chỉnh diện, 2 góc trái, 2 góc phải), nhận được {len(portrait_images)}'}),
                    headers=[('Content-Type', 'application/json')],
                    status=400
                )
            print(f"📸 Added {len(portrait_images)} portrait images")
            print(f"📁 Files being sent: {list(files.keys())}")
            for key, value in files.items():
                if key == 'portraitImages':
                    print(f"  {key}: {len(value)} files")
                else:
                    print(f"  {key}: {type(value)}")
            
            # Validate required files
            if not files.get('frontID'):
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Thiếu ảnh CCCD mặt trước'}),
                    headers=[('Content-Type', 'application/json')],
                    status=400
                )
            
            # eKYC service URL
            flask_url = 'http://host.docker.internal:8000/api/ekyc-process'
            
            # Debug logging
            print(f"🔍 Sending eKYC request to: {flask_url}")
            print(f"📁 Files being sent: {list(files.keys())}")
            print(f"📸 Portrait images count: {len(portrait_images)}")
            
            # Send files to eKYC service - using the correct format from old controller
            try:
                # Prepare files in the correct format
                files_to_send = []
                files_to_send.append(('frontID', (files['frontID'].filename, files['frontID'], files['frontID'].mimetype)))
                
                for i, img in enumerate(portrait_images):
                    files_to_send.append(('portraitImages', (f'face_{i+1}.jpg', img, img.mimetype)))
                
                print(f"🔍 DEBUG: Sending to Flask URL: {flask_url}")
                print(f"🔍 DEBUG: files length: {len(files_to_send)}")
                print(f"🔍 DEBUG: files keys: {[k for k, v in files_to_send]}")
                
                resp = requests.post(flask_url, files=files_to_send, timeout=60)
                print(f"📡 eKYC service response status: {resp.status_code}")
                print(f"🔍 DEBUG: Flask response text: {resp.text[:200]}...")
                
                if not resp.ok:
                    return request.make_response(
                        json.dumps({'success': False, 'error': f'eKYC service error: {resp.status_code} - {resp.text}'}),
                        headers=[('Content-Type', 'application/json')],
                        status=500
                    )
                
                data = resp.json()
                print(f"📊 eKYC service response: {data}")
                print(f"📊 eKYC service response type: {type(data)}")
                print(f"📊 eKYC service response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                
                # Debug: Check the structure of the response
                if isinstance(data, dict):
                    print(f"🔍 DEBUG: data['results'] exists: {'results' in data}")
                    if 'results' in data:
                        print(f"🔍 DEBUG: data['results']: {data['results']}")
                        print(f"🔍 DEBUG: data['results']['success']: {data['results'].get('success')}")
                        print(f"🔍 DEBUG: data['results']['face_matching']: {data['results'].get('face_matching')}")
                else:
                    print(f"🔍 DEBUG: data is not a dict, it's: {type(data)}")
            except Exception as e:
                print(f"❌ Error calling eKYC service: {e}")
                import traceback
                traceback.print_exc()
                return request.make_response(
                    json.dumps({'success': False, 'error': f'Lỗi kết nối eKYC service: {str(e)}'}),
                    headers=[('Content-Type', 'application/json')],
                    status=500
                )
            
                        # Check eKYC verification results
            try:
                results = data.get('results', {})
                print(f"📊 eKYC results: {results}")
                print(f"📊 eKYC results type: {type(results)}")
                
                # Check if eKYC service returned success
                if not results.get('success', False):
                    error_msg = results.get('error', 'Xác thực eKYC thất bại.')
                    return request.make_response(
                        json.dumps({'success': False, 'error': error_msg, 'data': data}),
                        headers=[('Content-Type', 'application/json')],
                        status=400
                    )
                
                # Check face matching result
                if not results.get('face_matching', False):
                    error_msg = 'Xác thực eKYC thất bại: Khuôn mặt không khớp với CCCD.'
                    
                    return request.make_response(
                        json.dumps({'success': False, 'error': error_msg, 'data': data}),
                        headers=[('Content-Type', 'application/json')],
                        status=400
                    )
            except Exception as e:
                print(f"❌ Error processing eKYC results: {e}")
                import traceback
                traceback.print_exc()
                return request.make_response(
                    json.dumps({'success': False, 'error': f'Lỗi xử lý kết quả eKYC: {str(e)}'}),
                    headers=[('Content-Type', 'application/json')],
                    status=500
                )
            
            # For /ekyc-process endpoint, we only get face matching results, not OCR data
            # OCR data should be processed separately via /ekyc/frontID and /ekyc/backID
            # So we just return the face matching success
            return request.make_response(
                json.dumps({
                    'success': True, 
                    'message': 'Xác thực eKYC thành công', 
                    'data': data
                }),
                headers=[('Content-Type', 'application/json')],
                status=200
            )
                
        except requests.exceptions.Timeout:
            return request.make_response(
                json.dumps({'success': False, 'error': 'eKYC service timeout. Vui lòng thử lại.'}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )
        except requests.exceptions.ConnectionError:
            return request.make_response(
                json.dumps({'success': False, 'error': 'Không thể kết nối đến eKYC service. Vui lòng kiểm tra kết nối.'}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )
        except Exception as e:
            return request.make_response(
                json.dumps({'success': False, 'error': f'Lỗi xử lý eKYC: {str(e)}'}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )





 