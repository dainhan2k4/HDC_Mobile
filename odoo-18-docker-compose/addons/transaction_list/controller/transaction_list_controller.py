from odoo import http
from odoo.http import request
import json
import base64
import os
from datetime import datetime
from odoo import fields


class TransactionListController(http.Controller):

    @http.route('/transaction-list', type='http', auth='user', website=True)
    def transaction_list_page(self, **kwargs):
        """Render transaction list page"""
        try:
            # Get transaction data directly from portfolio.transaction
            stats = self._get_transaction_stats()
            
            # Prepare data for frontend
            all_dashboard_data = {
                'stats': stats,
                'user': {
                    'name': request.env.user.name,
                    'id': request.env.user.id,
                },
                'company': {
                    'name': request.env.company.name,
                    'currency': request.env.company.currency_id.symbol,
                }
            }
            
            return request.render('transaction_list.transaction_list_page', {
                'all_dashboard_data': json.dumps(all_dashboard_data)
            })
            
        except Exception as e:
            return request.render('web.http_error', {
                'error': str(e),
                'error_title': 'Lỗi',
                'error_message': 'Không thể tải trang danh sách giao dịch'
            })

    @http.route('/api/transaction-list/get-transaction-details/<int:transaction_id>', type='http', auth='user', methods=['GET'])
    def get_transaction_details(self, transaction_id, **kwargs):
        """API endpoint to get detailed transaction information"""
        try:
            # Get transaction from database
            transaction = request.env['portfolio.transaction'].browse(transaction_id)
            
            if not transaction.exists():
                return request.make_json_response({
                    'success': False,
                    'message': 'Transaction not found'
                })
            
            # Return transaction details
            return request.make_json_response({
                'success': True,
                'transaction': {
                    'id': transaction.id,
                    'source': transaction.source,
                    'user_id': transaction.user_id.id if transaction.user_id else None,
                    'investor_name': transaction.investor_name or '',
                    'account_number': transaction.account_number or '',
                    'transaction_type': transaction.transaction_type,
                    'fund_name': transaction.fund_id.name if transaction.fund_id else '',
                    'amount': transaction.amount,
                    'units': transaction.units,
                    'current_nav': transaction.current_nav or 0,
                    'status': transaction.status
                }
            })
            
        except Exception as e:
            print(f"Error getting transaction details: {e}")
            return request.make_json_response({
                'success': False,
                'message': str(e)
            })

    @http.route('/api/transaction-list/data', type='json', auth='user')
    def get_transaction_data(self, **kwargs):
        """API endpoint to get transaction data directly from portfolio.transaction"""
        try:
            # Extract parameters from kwargs
            status_filter = kwargs.get('status_filter')
            source_filter = kwargs.get('source_filter')
            
            print(f"API called with status_filter: {status_filter}, source_filter: {source_filter}")
            print(f"All kwargs: {kwargs}")
            
            # Check if portfolio.transaction model exists
            if not request.env['ir.model'].search([('model', '=', 'portfolio.transaction')]):
                print("ERROR: portfolio.transaction model not found!")
                return {
                    'success': False,
                    'data': [],
                    'message': 'Model portfolio.transaction không tồn tại'
                }
            
            # Get data directly from portfolio.transaction using the extended model
            transaction_model = request.env['portfolio.transaction']
            print(f"Transaction model: {transaction_model}")
            print(f"Transaction model methods: {dir(transaction_model)}")
            
            # Check if get_transaction_data method exists
            if not hasattr(transaction_model, 'get_transaction_data'):
                print("WARNING: get_transaction_data method not found, using fallback!")
                # Fallback: lấy dữ liệu trực tiếp từ portfolio.transaction
                domain = []
                if status_filter:
                    domain.append(('status', '=', status_filter))
                if source_filter:
                    domain.append(('source', '=', source_filter))
                
                transactions = transaction_model.search(domain, order='create_date desc', limit=1000)
                data = []
                for tx in transactions:
                    data.append({
                        'id': tx.id,
                        'name': tx.name or '',
                        'account_number': getattr(tx, 'account_number', '') or '',
                        'investor_name': getattr(tx, 'investor_name', '') or '',
                        'investor_phone': getattr(tx, 'investor_phone', '') or '',
                        'fund_name': tx.fund_id.name if tx.fund_id else '',
                        'fund_ticker': tx.fund_id.ticker if tx.fund_id and hasattr(tx.fund_id, 'ticker') else '',
                        'transaction_code': tx.reference or '',
                        'transaction_type': tx.transaction_type or '',
                        'target_fund': '',
                        'target_fund_ticker': '',
                        'units': tx.units or 0,
                        'unit_price': tx.current_nav or 0,
                        'matched_units': getattr(tx, 'matched_units', 0) or 0,
                        'destination_units': 0,
                        'amount': tx.amount or 0,
                        'calculated_amount': tx.amount or 0,
                        'currency': tx.currency_id.symbol if tx.currency_id else 'VND',
                        'investment_type': '',
                        'status': tx.status or '',
                        'source': getattr(tx, 'source', '') or '',
                        'created_at': tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if tx.create_date else '',
                        'transaction_date': tx.transaction_date.strftime('%Y-%m-%d') if tx.transaction_date else '',
                        'approved_by': tx.approved_by.name if tx.approved_by else '',
                        'approved_at': tx.approved_at.strftime('%Y-%m-%d %H:%M:%S') if tx.approved_at else '',
                        'description': tx.description or ''
                    })
            else:
                data = transaction_model.get_transaction_data(status_filter, source_filter)
            
            print(f"Found {len(data)} transactions after filter")
            if data:
                print(f"Sample data: {data[0]}")
                print(f"Sample transaction status: {data[0].get('status')}")
            
            return {
                'success': True,
                'data': data,
                'message': 'Dữ liệu được tải thành công'
            }
        except Exception as e:
            print(f"Error in get_transaction_data: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'data': [],
                'message': f'Lỗi: {str(e)}'
            }



    @http.route('/api/transaction-list/stats', type='json', auth='user')
    def get_transaction_stats(self, **kwargs):
        """API endpoint to get transaction statistics from portfolio.transaction"""
        try:
            stats = self._get_transaction_stats()
            
            return {
                'success': True,
                'data': stats,
                'message': 'Thống kê được tải thành công'
            }
        except Exception as e:
            return {
                'success': False,
                'data': {},
                'message': f'Lỗi: {str(e)}'
            }

    def _get_transaction_stats(self):
        """Get transaction statistics from portfolio.transaction"""
        try:
            if not request.env['ir.model'].search([('model', '=', 'portfolio.transaction')]):
                return {
                    'total_pending': 0,
                    'total_approved': 0,
                    'total_cancelled': 0,
                }
            
            portfolio_model = request.env['portfolio.transaction']
            
            total_pending = portfolio_model.search_count([('status', '=', 'pending')])
            total_approved = portfolio_model.search_count([('status', '=', 'completed')])
            total_cancelled = portfolio_model.search_count([('status', '=', 'cancelled')])
            
            return {
                'total_pending': total_pending,
                'total_approved': total_approved,
                'total_cancelled': total_cancelled,
                'portal_pending': total_pending,  # All pending transactions
                'sale_pending': 0,  # No sale portal in portfolio.transaction
                'portfolio_pending': total_pending,
                'portfolio_approved': total_approved,
                'portfolio_cancelled': total_cancelled,
                'list_total': 0,  # No transaction.list anymore
                'portfolio_total': total_pending + total_approved + total_cancelled,
            }
        except Exception as e:
            print(f"Error getting portfolio transaction stats: {str(e)}")
            return {
                'total_pending': 0,
                'total_approved': 0,
                'total_cancelled': 0,
            }

    @http.route('/api/transaction-list/approve', type='json', auth='user')
    def approve_transaction(self, transaction_id, **kwargs):
        """API endpoint to approve a transaction"""
        try:
            transaction = request.env['portfolio.transaction'].browse(int(transaction_id))
            if not transaction.exists():
                return {
                    'success': False,
                    'message': 'Không tìm thấy giao dịch'
                }
            
            # Sử dụng action_approve thay vì action_complete
            if hasattr(transaction, 'action_approve'):
                transaction.action_approve()
            else:
                # Fallback: set status directly
                transaction.write({
                    'status': 'completed',
                    'approved_by': request.env.user.id,
                    'approved_at': fields.Datetime.now()
                })
            
            return {
                'success': True,
                'message': 'Giao dịch đã được duyệt thành công'
            }
        except Exception as e:
            print(f"Error approving transaction {transaction_id}: {str(e)}")
            return {
                'success': False,
                'message': f'Lỗi: {str(e)}'
            }

    @http.route('/api/transaction-list/cancel', type='json', auth='user')
    def cancel_transaction(self, transaction_id, **kwargs):
        """API endpoint to cancel a transaction"""
        try:
            transaction = request.env['portfolio.transaction'].browse(int(transaction_id))
            if not transaction.exists():
                return {
                    'success': False,
                    'message': 'Không tìm thấy giao dịch'
                }
            
            # Sử dụng action_cancel_list thay vì action_cancel
            if hasattr(transaction, 'action_cancel_list'):
                transaction.action_cancel_list()
            else:
                # Fallback: set status directly
                transaction.write({'status': 'cancelled'})
            
            return {
                'success': True,
                'message': 'Giao dịch đã được hủy thành công'
            }
        except Exception as e:
            print(f"Error cancelling transaction {transaction_id}: {str(e)}")
            return {
                'success': False,
                'message': f'Lỗi: {str(e)}'
            }

    @http.route('/api/transaction-list/delete', type='json', auth='user')
    def delete_transaction(self, transaction_id, **kwargs):
        """API endpoint to delete a transaction"""
        try:
            print(f"Delete transaction called with ID: {transaction_id}")
            print(f"Transaction ID type: {type(transaction_id)}")
            print(f"All kwargs: {kwargs}")
            
            # Validate transaction_id
            if not transaction_id:
                print("Transaction ID is empty or None")
                return {
                    'success': False,
                    'message': 'ID giao dịch không hợp lệ'
                }
            
            try:
                transaction_id_int = int(transaction_id)
            except (ValueError, TypeError):
                print(f"Cannot convert transaction_id '{transaction_id}' to int")
                return {
                    'success': False,
                    'message': 'ID giao dịch không hợp lệ'
                }
            
            print(f"Converted transaction ID: {transaction_id_int}")
            
            # Check if model exists
            if not request.env['ir.model'].search([('model', '=', 'portfolio.transaction')]):
                print("portfolio.transaction model not found")
                return {
                    'success': False,
                    'message': 'Model portfolio.transaction không tồn tại'
                }
            
            # Use sudo() to bypass access rights
            transaction = request.env['portfolio.transaction'].sudo().browse(transaction_id_int)
            print(f"Transaction browse result: {transaction}")
            
            if not transaction.exists():
                print(f"Transaction {transaction_id_int} not found")
                return {
                    'success': False,
                    'message': 'Không tìm thấy giao dịch'
                }
            
            print(f"Found transaction: {transaction.name}, status: {transaction.status}")
            print(f"Transaction ID: {transaction.id}")
            
            # Try to delete with sudo() to bypass access rights
            transaction_name = transaction.name
            try:
                # First try to unlink normally
                print("Attempting normal unlink...")
                transaction.unlink()
                print(f"Successfully deleted transaction: {transaction_name}")
            except Exception as unlink_error:
                print(f"Normal unlink failed: {str(unlink_error)}")
                print(f"Error type: {type(unlink_error)}")
                # If normal unlink fails, try with sudo
                print("Attempting sudo unlink...")
                transaction.sudo().unlink()
                print(f"Successfully deleted transaction with sudo: {transaction_name}")
            
            return {
                'success': True,
                'message': 'Giao dịch đã được xóa thành công'
            }
        except Exception as e:
            print(f"Error deleting transaction {transaction_id}: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'message': f'Lỗi: {str(e)}'
            }

    @http.route('/api/transaction-list/delete-simple', type='http', auth='user', methods=['POST'], csrf=False)
    def delete_transaction_simple(self, **kwargs):
        """Simple HTTP endpoint to delete a transaction"""
        try:
            transaction_id = kwargs.get('transaction_id')
            print(f"Simple delete called with ID: {transaction_id}")
            
            if not transaction_id:
                return json.dumps({'success': False, 'message': 'ID giao dịch không hợp lệ'})
            
            try:
                transaction_id_int = int(transaction_id)
            except (ValueError, TypeError):
                return json.dumps({'success': False, 'message': 'ID giao dịch không hợp lệ'})
            
            # Use sudo() to bypass access rights
            transaction = request.env['portfolio.transaction'].sudo().browse(transaction_id_int)
            
            if not transaction.exists():
                return json.dumps({'success': False, 'message': 'Không tìm thấy giao dịch'})
            
            # Delete the transaction
            transaction_name = transaction.name
            transaction.unlink()
            
            return json.dumps({
                'success': True,
                'message': 'Giao dịch đã được xóa thành công'
            })
        except Exception as e:
            print(f"Error in simple delete: {str(e)}")
            return json.dumps({'success': False, 'message': f'Lỗi: {str(e)}'})

    @http.route('/api/transaction-list/funds', type='json', auth='user')
    def get_funds(self, **kwargs):
        """API endpoint to get fund options for filter dropdown"""
        try:
            # Get funds from portfolio.fund model
            fund_model = request.env['portfolio.fund']
            funds = fund_model.search([])
            
            fund_data = []
            for fund in funds:
                ticker = ''
                symbol = ''
                
                # Try to get ticker field first
                if hasattr(fund, 'ticker') and fund.ticker:
                    ticker = fund.ticker
                elif hasattr(fund, 'symbol') and fund.symbol:
                    ticker = fund.symbol
                
                # Try to get symbol field
                if hasattr(fund, 'symbol') and fund.symbol:
                    symbol = fund.symbol
                elif hasattr(fund, 'ticker') and fund.ticker:
                    symbol = fund.ticker
                
                fund_data.append({
                    'id': fund.id,
                    'name': fund.name or '',
                    'ticker': ticker,
                    'symbol': symbol,
                })
            
            print(f"[DEBUG] Found {len(fund_data)} funds")
            if fund_data:
                print(f"[DEBUG] Sample fund: {fund_data[0]}")
            
            return {
                'success': True,
                'data': fund_data,
                'message': f'Lấy được {len(fund_data)} quỹ'
            }
        except Exception as e:
            print(f"Error getting funds: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Fallback: extract funds from transactions
            try:
                transaction_model = request.env['portfolio.transaction']
                transactions = transaction_model.search([])
                
                funds_dict = {}
                for tx in transactions:
                    if tx.fund_id:
                        funds_dict[tx.fund_id.id] = {
                            'id': tx.fund_id.id,
                            'name': tx.fund_id.name or '',
                            'ticker': getattr(tx.fund_id, 'ticker', '') or getattr(tx.fund_id, 'symbol', '') or '',
                            'symbol': getattr(tx.fund_id, 'symbol', '') or getattr(tx.fund_id, 'ticker', '') or '',
                        }
                
                fund_data = list(funds_dict.values())
                print(f"[DEBUG] Fallback: Found {len(fund_data)} funds from transactions")
                
                return {
                    'success': True,
                    'data': fund_data,
                    'message': f'Lấy được {len(fund_data)} quỹ (từ giao dịch)'
                }
            except Exception as fallback_error:
                print(f"Fallback also failed: {str(fallback_error)}")
                return {
                    'success': False,
                    'data': [],
                    'message': f'Lỗi: {str(e)}'
                }

    @http.route('/api/transaction-list/export', type='json', auth='user')
    def export_transactions(self, status_filter=None, source_filter=None, **kwargs):
        """API endpoint to export transaction data"""
        try:
            # Get data directly from portfolio.transaction using the extended model
            transaction_model = request.env['portfolio.transaction']
            
            # Use same fallback logic as get_transaction_data
            if not hasattr(transaction_model, 'get_transaction_data'):
                # Fallback: lấy dữ liệu trực tiếp từ portfolio.transaction
                domain = []
                if status_filter:
                    domain.append(('status', '=', status_filter))
                if source_filter:
                    domain.append(('source', '=', source_filter))
                
                transactions = transaction_model.search(domain, order='create_date desc', limit=1000)
                data = []
                for tx in transactions:
                    data.append({
                        'id': tx.id,
                        'name': tx.name or '',
                        'account_number': getattr(tx, 'account_number', '') or '',
                        'investor_name': getattr(tx, 'investor_name', '') or '',
                        'investor_phone': getattr(tx, 'investor_phone', '') or '',
                        'fund_name': tx.fund_id.name if tx.fund_id else '',
                        'fund_ticker': tx.fund_id.ticker if tx.fund_id and hasattr(tx.fund_id, 'ticker') else '',
                        'transaction_code': tx.reference or '',
                        'transaction_type': tx.transaction_type or '',
                        'target_fund': '',
                        'target_fund_ticker': '',
                        'units': tx.units or 0,
                        'unit_price': tx.current_nav or 0,
                        'matched_units': getattr(tx, 'matched_units', 0) or 0,
                        'destination_units': 0,
                        'amount': tx.amount or 0,
                        'calculated_amount': tx.amount or 0,
                        'currency': tx.currency_id.symbol if tx.currency_id else 'VND',
                        'investment_type': '',
                        'status': tx.status or '',
                        'source': getattr(tx, 'source', '') or '',
                        'created_at': tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if tx.create_date else '',
                        'transaction_date': tx.transaction_date.strftime('%Y-%m-%d') if tx.transaction_date else '',
                        'approved_by': tx.approved_by.name if tx.approved_by else '',
                        'approved_at': tx.approved_at.strftime('%Y-%m-%d %H:%M:%S') if tx.approved_at else '',
                        'description': tx.description or ''
                    })
            else:
                data = transaction_model.get_transaction_data(status_filter, source_filter)
            
            # Convert to CSV format
            csv_data = self._convert_to_csv(data)
            
            return {
                'success': True,
                'data': csv_data,
                'filename': f'transaction_list_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
                'message': 'Dữ liệu xuất thành công'
            }
        except Exception as e:
            return {
                'success': False,
                'data': '',
                'message': f'Lỗi: {str(e)}'
            }

    def _convert_to_csv(self, data):
        """Convert transaction data to CSV format"""
        if not data:
            return ""
        
        # CSV headers
        headers = [
            'ID', 'Tên giao dịch', 'Số tài khoản', 'Nhà đầu tư', 'Số điện thoại', 
            'Quỹ', 'Mã quỹ', 'Mã GD', 'Loại lệnh', 'Quỹ mục tiêu', 'Mã quỹ mục tiêu', 
            'Số CCQ', 'Giá tiền', 'Số lượng khớp', 'Số CCQ mục tiêu', 'Tổng số tiền', 'Số tiền tính toán', 
            'Loại đầu tư', 'Trạng thái', 'Nguồn', 'Ngày tạo', 'Ngày giao dịch',
            'Người duyệt', 'Ngày duyệt', 'Mô tả'
        ]
        
        csv_content = ','.join(f'"{header}"' for header in headers) + '\n'
        
        for item in data:
            row = [
                str(item.get('id', '')),
                item.get('name', ''),
                item.get('account_number', ''),
                item.get('investor_name', ''),
                item.get('investor_phone', ''),
                item.get('fund_name', ''),
                item.get('fund_ticker', ''),
                item.get('transaction_code', ''),
                item.get('transaction_type', ''),
                item.get('target_fund', ''),
                item.get('target_fund_ticker', ''),
                str(item.get('units', '')),
                f"{item.get('currency', '')}{item.get('unit_price', 0)}",
                str(item.get('matched_units', '')),
                str(item.get('destination_units', '')),
                f"{item.get('currency', '')}{item.get('amount', '')}",
                f"{item.get('currency', '')}{item.get('calculated_amount', '')}",
                item.get('investment_type', ''),
                item.get('status', ''),
                item.get('source', ''),
                item.get('created_at', ''),
                item.get('transaction_date', ''),
                item.get('approved_by', ''),
                item.get('approved_at', ''),
                item.get('description', '')
            ]
            csv_content += ','.join(f'"{str(cell)}"' for cell in row) + '\n'
        
        return csv_content

    @http.route('/transaction-list/contract/<int:tx_id>', type='http', auth='user')
    def transaction_contract(self, tx_id, download=False, **kw):
        """Route để xem và tải hợp đồng của giao dịch"""
        tx = request.env['portfolio.transaction'].sudo().browse(tx_id)
        if not tx or not tx.exists():
            return request.not_found()

        field = tx._fields.get('contract_pdf_path')
        if not field:
            return request.not_found()

        headers = [
            ('Content-Type', 'application/pdf'),
            ('X-Content-Type-Options', 'nosniff'),
        ]

        filename = f"contract_{tx_id}.pdf"
        if str(download).lower() in ('1', 'true', 'yes'):
            headers.append(('Content-Disposition', f'attachment; filename="{filename}"'))
        else:
            headers.append(('Content-Disposition', f'inline; filename="{filename}"'))

        try:
            if field.type == 'binary':
                if not tx.contract_pdf_path:
                    return request.not_found()
                data = base64.b64decode(tx.contract_pdf_path)
                return request.make_response(data, headers=headers)
            else:
                path = tx.contract_pdf_path
                if not path or not os.path.isfile(path):
                    return request.not_found()
                with open(path, 'rb') as f:
                    data = f.read()
                return request.make_response(data, headers=headers)
        except Exception:
            return request.not_found() 

    @http.route('/api/transaction-list/contract/<int:transaction_id>', type='http', auth='user')
    def download_contract(self, transaction_id, download=None, **kwargs):
        """Download contract PDF for a transaction"""
        try:
            transaction = request.env['portfolio.transaction'].sudo().browse(transaction_id)
            if not transaction.exists():
                return "Transaction không tồn tại"
            
            if not transaction.contract_pdf_path:
                return "Không có file hợp đồng"
            
            # Đường dẫn file hợp đồng
            file_path = transaction.contract_pdf_path
            
            # Kiểm tra file có tồn tại không
            if not os.path.exists(file_path):
                return "File hợp đồng không tồn tại"
            
            # Đọc file
            with open(file_path, 'rb') as file:
                file_content = file.read()
            
            # Tên file
            filename = os.path.basename(file_path)
            
            # Headers cho download
            headers = [
                ('Content-Type', 'application/pdf'),
                ('Content-Disposition', f'attachment; filename="{filename}"' if download else f'inline; filename="{filename}"'),
                ('Content-Length', str(len(file_content)))
            ]
            
            return request.make_response(file_content, headers=headers)
            
        except Exception as e:
            print(f"Error downloading contract: {str(e)}")
            return f"Lỗi khi tải file: {str(e)}"

 