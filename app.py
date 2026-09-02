from flask import Flask, render_template, request,  redirect, session, flash, jsonify, url_for

from supabase import create_client, Client, ClientOptions
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import os 


# CHẠY BACK END CHO WEB BẰNG FLASK VÀ SUPABASE-------------------------------------------------------
# chạy hàm để lấy key bảo mật từ .env
load_dotenv()


# lấy key và url trong file .env, file này lưu đường dẫn và password trong thư mục cá nhân để trành lộ dữ liệu
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")


#  tạo client thông qua url và key 
supabase: Client = create_client(url, key)


# chỗ này là rpc: remote procedure call để gọi từ xa việc thực thi một hàm trong postgres trên supabase
result = supabase.rpc('check_my_role').execute()
print("SUPABASE ROLE:", result.data)

app = Flask(__name__)
# dùng kèm với password để mã hóa dữ liệu key cho mỗi session 
app.secret_key = 'my_super_secret_key_123456' # Thêm dòng này

#  test hiển thị đăng nhập -------------
# 1. Route hiển thị giao diện Đăng nhập / Đăng ký
@app.route('/test_login')
def test_login():
    if 'access_token' in session:
        return redirect(url_for('product'))
    return render_template('test_login.html')

# @app.route('/post')
# def post():
#     posts = supabase.table('posts').select('*').order('created_at', desc=True).execute()
#     return render_template('index.html', posts=posts.data)

# 2. Route Xử lý Đăng ký
@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')

    try:
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {"username": username}
            }
        })
        return jsonify({"message": "Đăng ký thành công! Vui lòng liên hệ Admin để cấp quyền truy cập."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
# 3. Route Xử lý Đăng nhập
# 1. ROUTE API LOGIN (Đảm bảo lưu access_token đúng chuẩn chuỗi)
@app.route('/api/login', methods=['POST'])
def api_login():
  data = request.get_json() or {}
  email = data.get('email')
  password = data.get('password')

  try:
    res = supabase.auth.sign_in_with_password(
        {'email': email, 'password': password}
    )

    if not res.session or not res.user:
      return jsonify({'error': 'Đăng nhập không thành công'}), 401

    # ÉP KIỂU STR ĐỂ ĐẢM BẢO TOKEN LÀ CHUỖI CHUẨN JWT
    session['access_token'] = str(res.session.access_token)
    session['user_id'] = str(res.user.id)
    session['email'] = str(res.user.email)

    return (
        jsonify({
            'message': 'Đăng nhập thành công',
            'redirect_url': url_for('product'),
        }),
        200,
    )
  except Exception as e:
    return jsonify({'error': str(e)}), 401
    
# 4. Trang Dashboard bảo mật (yêu cầu kiểm tra Session)
@app.route('/dashboard')
def dashboard():
    access_token = session.get('access_token')
    if not access_token:
        return redirect(url_for('test_login'))

    # Khởi tạo Supabase client đi kèm Token để kích hoạt RLS cho từng request
    user_supabase = create_client(
        url, 
        key, 
        options={"headers": {"Authorization": f"Bearer {access_token}"}}
    )
    
    return jsonify({"message": f"Xin chào {session.get('email')}, bạn đã đăng nhập thành công!", 
                    "redirect_url": url_for("product")}) 

# 5. Route Đăng xuất
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('test_login'))
# ------------------

# hiển thị trang web------------------------------------

# 2. ROUTE PRODUCT (Khởi tạo Auth với JWT Token)
@app.route('/product')
def product():
  user_access_token = session.get('access_token')

  if not user_access_token:
    flash('Bạn cần đăng nhập để truy cập!')
    return redirect(url_for('test_login'))

  try:
    # Truyền trực tiếp Token lấy từ Session vào hàm get_user()
    user_response = supabase.auth.get_user(user_access_token)

    if not user_response or not user_response.user:
      print('Token không hợp lệ hoặc hết hạn!')
      session.clear()
      flash('Phiên đăng nhập hết hạn!')
      return redirect(url_for('test_login'))

    current_user_id = user_response.user.id

    # Lấy Profile
    profile_res = (
        supabase.table('profiles')
        .select('*')
        .eq('id', current_user_id)
        .execute()
    )
    profile = profile_res.data[0] if profile_res.data else None

    # Lấy Product
    product_res = supabase.table('view_product_details').select('*').execute()
    product_data = product_res.data if product_res.data else []
    
    # lấy group product
    prod_group_res = supabase.table('prod_group').select('*').execute()
    prod_group_data = prod_group_res.data if prod_group_res.data else []
    print('prod_group_data', prod_group_data)

    # lấy nhà cung cấp
    suplier_res = supabase.table('suplier').select('*').execute()
    suplier_data = suplier_res.data if suplier_res.data else []
    print('suplier_data', suplier_data)
        
    context = {
        'profile': profile,
        'product_data': product_data,
        'prod_group_data': prod_group_data,
        'suplier_data': suplier_data,
    }

    return render_template('product.html', **context)

  except Exception as e:
    print('Lỗi tại /product:', e)
    session.clear()
    flash('Có lỗi xảy ra khi tải dữ liệu trang sản phẩm!')
    return redirect(url_for('test_login'))

@app.route('/add', methods=['GET', 'POST'])
def add_post():
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        
        # 1. Lấy access_token của user đã đăng nhập (lưu từ bước login)
        user_access_token = session.get('access_token')
            
        if not user_access_token:
            flash("Bạn chưa đăng nhập!")
            return redirect('/login')

        # 2. Tạo client Supabase đóng vai trò chính user đó
        user_supabase = create_client(
            url, 
            key,
            options=ClientOptions(
                headers={"Authorization": f"Bearer {user_access_token}"}
            )
        )
        
        try:
            # 3. Lấy user_id hiện tại từ Supabase Auth
            ## Hàm trợ giúp tạo client theo request (An toàn, không lo đụng độ Token giữa các user)
            user_response = user_supabase.auth.get_user(user_access_token)
            user_id = user_response.user.id

            # 4. Insert dữ liệu - RLS sẽ tự kiểm tra quyền Staff ở bước này
            res = user_supabase.table('posts').insert({
                'title': title,
                'content': content,
                'user_id': user_id
            }).execute()

            flash("Đăng bài thành công!")
            return redirect('/')

        except Exception as e:
            # Nếu không phải Staff, Supabase RLS sẽ trả về lỗi tại đây
            flash("Lỗi: Bạn không có quyền đăng bài (Chỉ Staff mới được phép)!")
     


#             return redirect('/')

#     return render_template('add.html')

# # delete a post
# @app.route('/delete/<int:post_id>')
# def delete_post(post_id):
#     supabase.table('posts').delete().eq('id', post_id).execute()
#     return redirect('/')

# # Edit a post
# @app.route('/edit/<int:post_id>', methods=['GET', 'POST'])
# def edit_post(post_id):
#     # 1. Kiểm tra xem user đã đăng nhập chưa
#     user_access_token = session.get('access_token')
#     if not user_access_token:
#         flash("Bạn cần đăng nhập để sửa bài!")
#         return redirect('/login')

#     # 2. Tạo Client xác thực (đính kèm token)
#     user_supabase = create_client(
#         url, 
#         key,
#         options=ClientOptions(
#             headers={"Authorization": f"Bearer {user_access_token}"}
#         )
#     )
    
#     # Lấy thông tin bài viết (vẫn cần xác thực để xem bài)
#     post = user_supabase.table('posts').select('*').eq('id', post_id).single().execute().data
    
#     if request.method == 'POST':
#         title = request.form['title']
#         content = request.form['content']
        
#         try:
#             # 3. Thực hiện Update với Client đã có Token
#             user_supabase.table('posts').update({
#                 'title': title, 
#                 'content': content
#             }).eq('id', post_id).execute()
            
#             flash("Cập nhật thành công!")
#             return redirect('/')
#         except Exception as e:
#             flash(f"Lỗi: Bạn không có quyền sửa bài này! ({e})")
#             return redirect('/')

#     return render_template('edit.html', post=post)




# admin phân quyền, quản lý 

# 1. Route hiển thị trang Admin Dashboard
@app.route('/admin')
def admin_dashboard():
    user_access_token = session.get('access_token')
    if not user_access_token:
        flash("Bạn chưa đăng nhập!")
        return redirect('/login')

    # Tạo User Supabase Client để check quyền Admin
    user_supabase = create_client(
        url, key, options=ClientOptions(headers={"Authorization": f"Bearer {user_access_token}"})
    )

    try:
        # Lấy thông tin profiles (danh sách user + role)
        profiles = user_supabase.table('profiles').select('*').execute().data
        # Lấy toàn bộ danh sách bài viết
        posts = user_supabase.table('posts').select('*').order('created_at', desc=True).execute().data
        
        return render_template('admin.html', profiles=profiles, posts=posts)
    except Exception as e:
        flash(f"Lỗi truy cập Admin: Bạn không phải Admin hoặc bị từ chối RLS! ({e})")
        return redirect('/')


# 2. Route cập nhật Quyền (Role) của người dùng
@app.route('/admin/update-role', methods=['POST'])
def update_user_role():
    user_access_token = session.get('access_token')
    if not user_access_token:
        flash("Bạn chưa đăng nhập!")
        return redirect('/login')

    target_user_id = request.form['user_id']
    new_role = request.form['role'] # Nhan 'viewer', 'staff', hoac 'admin'

    user_supabase = create_client(
        url, key, options=ClientOptions(headers={"Authorization": f"Bearer {user_access_token}"})
    )

    try:
        # Cập nhật cột role trong bảng profiles
        user_supabase.table('profiles').update({'role': new_role}).eq('id', target_user_id).execute()
        flash(f"Đã cập nhật quyền thành công cho User!")
    except Exception as e:
        flash(f"Lỗi: Bạn không có quyền cấp quyền người dùng! ({e})")

    return redirect('/admin')


# test lấy hiển thị bảng sản phẩm và qr code -------------------------------------------------


@app.route('/stock')
def stock():
    return render_template('stock.html')

@app.route('/qrcode')
def qrcode_tracker():
    return render_template('QR_tracker.html')

# ---------------------------------------



# -------- ĐỌC VÀ LƯU HÌNH ẢNH VÀO SUPABASE
BUCKET_NAME = "product-images"


@app.route('/take_picture')
def take_picture():
    # Flask sẽ tự động tìm file index.html nằm trong thư mục templates/
    return render_template('take_picture.html')

@app.route('/api/products', methods=['POST'])
def upload_product():
    if 'image' not in request.files:
        return jsonify({'error': 'Không tìm thấy file ảnh'}), 400

    file = request.files['image']
    name = request.form.get('name')

    if file:
        filename = secure_filename(file.filename)
        # Tạo tên file duy nhất để tránh bị trùng đè
        unique_filename = f"{os.urandom(4).hex()}_{filename}"
        
        # Đọc nội dung file dưới dạng bytes
        file_bytes = file.read()
        file_mime = file.mimetype

        # 1. Upload file lên Supabase Storage
        upload_response = supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": file_mime}
        )

        # 2. Lấy Public URL của ảnh vừa upload
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)

        # 3. Lưu thông tin + Public URL vào PostgreSQL Table qua Supabase Database API
        db_response = supabase.table("products").insert({
            "name": name,
            "image_url": public_url
        }).execute()

        return jsonify({
            'success': True,
            'data': db_response.data[0]
        }), 201

    return jsonify({'error': 'File không hợp lệ'}), 400


@app.route('/api/products', methods=['GET'])
def get_products():
    # Truy vấn bảng products từ Supabase
    response = supabase.table("products").select("*").execute()
    return jsonify(response.data)
# ĐỌC VÀ LƯU HÌNH ẢNH VÀO SUPABASE-------------

if __name__ == '__main__':
    app.run(debug=True)
    # Sử dụng PORT từ môi trường (Cần thiết cho Cloud hosting)
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)