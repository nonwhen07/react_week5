import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Modal } from "bootstrap";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState([]);

  const[carts, setCarts] = useState([]);

  //取得cart
  const getCarts = async()=>{
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/cart`);
      setCarts(res.data.data.carts);
    } catch (error) {
      console.error(error);
      alert("取得購物車失敗");
    }
  }

  useEffect(() => {
    const getProducts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/products`);
        setProducts(res.data.products);
      } catch (error) {
        console.error(error);
        alert("取得產品失敗");
      }
    };
    
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
  const addCartItem = async (product_id, qty = 1) => {
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/cart`, {
        data:{
          product_id,
          qty: Number(qty)
        }
      });
      //成功後刷新購物車，並關閉modal
      getCarts();
      closeModal();
    } catch (error) {
      console.error(error);
      alert("加入購物車失敗");
    }
  }
  //調整購物車品項
  const editCartItem = async (cart_id, product_id, qty = 1) => {
    // 如果 qty 小於 1，直接返回不做任何處理 作法A
    if (qty < 1) {
      console.warn("qty 不能小於 1");
      return;
    }
    // 當 qty 小於 1 時，自動刪除該項目 作法B
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
    }
  }
  //刪除購物車品項
  const deleCartItem = async (cart_id) => {
    try {
      await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/cart/${cart_id}`);
      //成功後刷新購物車
      getCarts();
    } catch (error) {
      console.error(error);
      alert("刪除購物車品項失敗");
    }
  }
  //移除全部購物車品項
  const deleAllCart = async () => {
    try {
      await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/carts`);
      alert("刪除全部購物車成功");
      //成功後刷新購物車
      getCarts();
    } catch (error) {
      console.error(error);
      alert("刪除全部購物車失敗");
    }
  }


  return (
    <div className="container">
      <div className="mt-4">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>圖片</th>
              <th>商品名稱</th>
              <th>價格</th>
              <th></th>
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
                    <button onClick={() => addCartItem(product.id, 1)} type="button" className="btn btn-outline-danger">
                      加到購物車
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* productModalRef */}
        <div
          ref={productModalRef}
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
                <button onClick={ () => addCartItem(tempProduct.id, qtySelect)} type="button" className="btn btn-primary">
                  加入購物車
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
        <form className="col-md-6">
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="請輸入 Email"
            />

            <p className="text-danger my-2"></p>
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              收件人姓名
            </label>
            <input
              id="name"
              className="form-control"
              placeholder="請輸入姓名"
            />

            <p className="text-danger my-2"></p>
          </div>

          <div className="mb-3">
            <label htmlFor="tel" className="form-label">
              收件人電話
            </label>
            <input
              id="tel"
              type="text"
              className="form-control"
              placeholder="請輸入電話"
            />

            <p className="text-danger my-2"></p>
          </div>

          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              收件人地址
            </label>
            <input
              id="address"
              type="text"
              className="form-control"
              placeholder="請輸入地址"
            />

            <p className="text-danger my-2"></p>
          </div>

          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              留言
            </label>
            <textarea
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
  );
}

export default App;

