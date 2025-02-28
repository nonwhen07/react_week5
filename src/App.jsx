import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Modal } from "bootstrap";

import ReactLoading from 'react-loading';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState([]);
  const [carts, setCarts] = useState([]);
  const [isScreenLoading, setIsScreenLoading] = useState(false);
  // const [isLoading, setIsLoading] = useState(false); //改用下面的loadingItems，先儲存商品ID來標定loading位置
  const [loadingItems, setLoadingItems] = useState({}); // 用物件儲存各商品的 Loading 狀態

  //取得cart
  const getCarts = async()=>{
    setIsScreenLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/cart`);
      setCarts(res.data.data.carts);
    } catch (error) {
      console.error(error);
      alert("取得購物車失敗");
    }finally{
      setIsScreenLoading(false);
    }
  }

  useEffect(() => {
    setIsScreenLoading(true);
    const getProducts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/products`);
        setProducts(res.data.products);
      } catch (error) {
        console.error(error);
        alert("取得產品失敗");
      }finally{
        setIsScreenLoading(false);
      }
    };
    //畫面渲染後初步載入產品列表+購物車
    getProducts();
    getCarts();
  }, []);

  const productModalRef = useRef(null);
  useEffect(() => {
    new Modal(productModalRef.current, { backdrop: false });
  }, []);

  const openModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  };

  const closeModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
  };

  const handleSeeMore = (product) => {
    setTempProduct(product);
    openModal();
  };

  const [qtySelect, setQtySelect] = useState(1);

  //加入購物車
  const addCartItem = async (product_id, qty = 1, source = "table") => {
    // 如果 qty 小於 1，直接返回不做任何處理
    if (qty < 1) {
      console.warn("qty 不能小於 1");
      return;
    }

    setLoadingItems((prev) => ({
      ...prev,
      [product_id]: { ...prev[product_id], [source]: true }, // 只改變對應的 source
    }));

    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/cart`, {
        data: {
          product_id,
          qty: Number(qty),
        },
      });
      // 成功後刷新購物車
      getCarts();
      closeModal();
    } catch (error) {
      console.error(error);
      alert("加入購物車失敗");
    } finally {
      setLoadingItems((prev) => ({
        ...prev,
        [product_id]: { ...prev[product_id], [source]: false }, // 結束 Loading
      }));
    }
  };

  //調整購物車品項
  const editCartItem = async (cart_id, product_id, qty = 1) => {
    setIsScreenLoading(true);
    // 如果 qty 小於 1，直接返回不做任何處理 作法A
    if (qty < 1) {
      console.warn("qty 不能小於 1");
      return;
    }
    // 當 qty 小於 1 時，自動刪除該項目，但是可能造成使用者不理解品像突然消失，故不適用 作法B
    // if (qty < 1) {
    //   return deleCartItem(cart_id);
    // }
    try {
      await axios.put(`${BASE_URL}/v2/api/${API_PATH}/cart/${cart_id}`, {
        data:{
          product_id,
          qty: Number(qty)
        }
      });
      //成功後刷新購物車
      getCarts();
    } catch (error) {
      console.error(error);
      alert("調整購物車數量失敗");
    }finally{
      setIsScreenLoading(false);
    }
  }
  //刪除購物車品項
  const deleCartItem = async (cart_id) => {
    setIsScreenLoading(true);
    try {
      await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/cart/${cart_id}`);
      //成功後刷新購物車
      getCarts();
    } catch (error) {
      console.error(error);
      alert("刪除購物車品項失敗");
    }finally{
      setIsScreenLoading(false);
    }
  }
  //移除全部購物車品項
  const deleAllCart = async () => {
    setIsScreenLoading(true);
    try {
      await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/carts`);
      alert("刪除全部購物車成功");
      //成功後刷新購物車
      getCarts();
    } catch (error) {
      console.error(error);
      alert("刪除全部購物車失敗");
    }finally{
      setIsScreenLoading(false);
    }
  }


  const { register, handleSubmit, formState:{ errors }, reset } = useForm();

  //送出Submit事件驅動
  const onSubmit =  handleSubmit((data) => {
    const { message, ...user } = data; //data資料"解構"成message，剩下的打包一起變成user
    const userinfo = {
      data: {
        user: user,
        message: message
      }
    }
    checkOut(userinfo);  
  });

  const checkOut = async (orderData) => {
    setIsScreenLoading(true);
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/order`, orderData);
      //成功後刷新購物車，等待下一位客人
      getCarts();
      reset(); // 提交成功後重設表單
      alert("已送出訂單");
    } catch (error) {
      console.error(error);
      alert("結帳失敗");
    }finally{
      setIsScreenLoading(false);
    }
  }


  return (
    <>
    <div className="container">
      <div className="mt-4">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>圖片</th>
              <th>商品名稱</th>
              <th>價格</th>
              <th style={{ minWidth: "200px", width: "auto", maxWidth: "280px" }}></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={{ width: "200px" }}>
                  <img
                    className="img-fluid"
                    src={product.imageUrl}
                    alt={product.title}
                  />
                </td>
                <td>{product.title}</td>
                <td>
                  <del className="h6">原價 {product.origin_price} 元</del>
                  <div className="h5">特價 {product.price}元</div>
                </td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button
                      onClick={() => handleSeeMore(product)}
                      type="button"
                      className="btn btn-outline-secondary"
                    >
                      查看更多
                    </button>
                    <button disabled={loadingItems[product.id]?.table} onClick={() => addCartItem(product.id, 1, "table")} type="button" 
                      className="btn btn-outline-danger d-flex align-items-center">
                      加到購物車
                      {
                        loadingItems[product.id]?.table && (
                          // <ReactLoading className="d-flex align-items-center" type="spin" color="#000" height="1.25rem" width="1.25rem" />
                          <div className="d-flex align-items-center" style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ReactLoading type="spin" color="#000" height="1.25rem" width="1.25rem" />
                          </div>
                        )
                      }
                    </button>
                    
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* productModalRef */}
        <div ref={productModalRef}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          className="modal fade"
          id="productModal"
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title fs-5">
                  產品名稱：{tempProduct.title}
                </h2>
                <button
                  onClick={closeModal}
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <img
                  src={tempProduct.imageUrl}
                  alt={tempProduct.title}
                  className="img-fluid"
                />
                <p>內容：{tempProduct.content}</p>
                <p>描述：{tempProduct.description}</p>
                <p>
                  價錢：{tempProduct.price}{" "}
                  <del>{tempProduct.origin_price}</del> 元
                </p>
                <div className="input-group align-items-center">
                  <label htmlFor="qtySelect">數量：</label>
                  <select
                    value={qtySelect}
                    onChange={(e) => setQtySelect(e.target.value)}
                    id="qtySelect"
                    className="form-select"
                  >
                    {Array.from({ length: 10 }).map((_, index) => (
                      <option key={index} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button disabled={loadingItems[tempProduct.id]?.modal} onClick={() => addCartItem(tempProduct.id, qtySelect, "modal")} type="button" 
                  className="btn btn-primary d-flex align-items-center gap-2">
                  加入購物車
                  {
                    loadingItems[tempProduct.id]?.modal && (<ReactLoading type={"spin"} color={"#000"} height={"1.5rem"} width={"1.5rem"} />)
                  }
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>

        {
          carts.length > 0 ? 
          <>
            <div className="text-end py-3">
              <button onClick={ () => deleAllCart() } className="btn btn-outline-danger" type="button">
                清空購物車
              </button>
            </div>
            <table className="table align-middle">
              <thead>
                <tr>
                  <th></th>
                  <th>品名</th>
                  <th style={{ width: "150px" }}>數量/單位</th>
                  <th className="text-end">單價</th>
                </tr>
              </thead>

              <tbody>
                {carts.map((cart) =>(
                <tr key={cart.id}>
                  <td>
                    <button onClick={() => deleCartItem(cart.id)} type="button" className="btn btn-outline-danger btn-sm">
                      x
                    </button>
                  </td>
                  <td>{cart.product.title}</td>
                  <td style={{ width: "150px" }}>
                    <div className="d-flex align-items-center">
                      <div className="btn-group me-2" role="group">
                        <button
                          onClick={() => editCartItem(cart.id, cart.product.id, cart.qty - 1)}
                          type="button"
                          className={`btn btn-sm ${cart.qty === 1 ? "btn-outline-secondary" : "btn-outline-dark"}`}
                          // className="btn btn-sm btn-outline-dark"
                          disabled={cart.qty === 1} // 避免 qty 變成 0
                        >
                          -
                        </button>

                        <span
                          className="btn border border-dark"
                          style={{ width: "50px", cursor: "auto" }}
                        >
                          {cart.qty}
                        </span>

                        <button
                          onClick={() => editCartItem(cart.id, cart.product.id, cart.qty+1)}
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="input-group-text bg-transparent border-0">
                        {cart.product.unit}
                      </span>
                    </div>
                  </td>
                  <td className="text-end"> {cart.total}</td>
                </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end">
                    總計：
                  </td>
                  <td className="text-end" style={{ width: "130px" }}>
                    { carts.reduce((total, cart) => total + cart.total, 0) }
                  </td>
                </tr>
              </tfoot>
            </table>
          </>
          : (
          <div className="text-center text-muted">
            <p>🛒 購物車是空的</p>
          </div>)
        }

        {/* cartTable */}
        
        
      </div>
      {/* orderTable */}
      <div className="my-5 row justify-content-center">
        <form onSubmit={onSubmit} className="col-md-6">
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              {
                ...register('email', {
                required: "Email 欄位必填",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Email 格式錯誤"
                }})
              }
              id="email"
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="請輸入 Email"
            />
            { errors.email && <p className="text-danger my-2">{errors.email.message}</p> }
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              收件人姓名
            </label>
            <input
            { ...register('name', { required: "姓名 欄位必填" }) }
              id="name"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              placeholder="請輸入姓名"
            />
            { errors.name && <p className="text-danger my-2">{errors.name.message}</p> }
          </div>

          <div className="mb-3">
            <label htmlFor="tel" className="form-label">
              收件人電話
            </label>
            <input
              {
                ...register('tel', {
                required: "電話 欄位必填",
                pattern: {
                  value: /^(0[2-8]\d{7}|09\d{8})$/,
                  message: "電話 格式錯誤"
                }})
              }
              id="tel"
              type="text"
              className={`form-control ${errors.tel ? "is-invalid" : ""}`}
              placeholder="請輸入電話"
            />
            { 
              errors.tel && <p className="text-danger my-2">{errors.tel.message}</p> 
            }
          </div>

          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              收件人地址
            </label>
            <input
              {
                ...register('address', { required: "地址 欄位必填"})
              }
              id="address"
              type="text"
              className={`form-control ${errors.address ? "is-invalid" : ""}`}
              placeholder="請輸入地址"
            />

            { errors.address && <p className="text-danger my-2">{errors.address.message}</p> }
          </div>

          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              留言
            </label>
            <textarea
              { ...register('message') }
              id="message"
              className="form-control"
              cols="30"
              rows="10"
            ></textarea>
          </div>
          <div className="text-end">
            <button type="submit" className="btn btn-danger">
              送出訂單
            </button>
          </div>
        </form>
      </div>
    </div>


    {
      isScreenLoading && (
      <div className="d-flex justify-content-center align-items-center"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(255,255,255,0.3)",
          zIndex: 999,
        }}
      >
        <ReactLoading type="spin" color="black" width="4rem" height="4rem" />
      </div>
      )
    }
    
    

    </>
  );
}

export default App;

