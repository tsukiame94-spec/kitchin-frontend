import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [activeTab, setActiveTab] = useState('shopping');
  const [foods, setFoods] = useState([]);
  const [name, setName] = useState('');
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (text, error = false) => {
    setMessage(text);
    setIsError(error);
    setTimeout(() => {
      setMessage('');
    }, 4000);
  };
  
  const getToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [menus, setMenus] = useState([]);
  const [date, setDate] = useState(getToday);
  const [menuText, setMenuText] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://kitchin-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
        setUsernameInput('');
        setPasswordInput('');
        showMessage('ログインしました！');
      } else {
        showMessage(data.message || 'ログインに失敗しました', true);
      }
    } catch (error) {
      console.error(error);
      showMessage('サーバーとの通信に失敗しました', true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('https://kitchin-backend.onrender.com/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error(e);
    }
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    showMessage('ログアウトしました');
  };

  const fetchFoods = async () => {
    try {
      const response = await fetch('https://kitchin-backend.onrender.com/api/foods', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('データの取得に失敗しました');
      const data = await response.json();
      setFoods(data);
    } catch (error) {
      console.error(error);
      showMessage('食材データの取得に失敗しました', true);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await fetch('https://kitchin-backend.onrender.com/api/menus', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('献立履歴の取得に失敗しました');
      const data = await response.json();
      setMenus(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchFoods();
      fetchMenus();
    }
  }, [isLoggedIn]);

  const addFood = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showMessage('食材の名前を入力してください', true);
      return;
    }

    try {
      const response = await fetch('https://kitchin-backend.onrender.com/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, checked: false, usedToday: false }),
        credentials: 'include',
      });
      if (response.ok) {
        setName('');
        fetchFoods();
        showMessage('食材を追加しました！');
      } else {
        throw new Error('追加に失敗しました');
      }
    } catch (error) {
      console.error(error);
      showMessage('食材の追加に失敗しました', true);
    }
  };

  const toggleFood = async (food) => {
    try {
      const response = await fetch(`https://kitchin-backend.onrender.com/api/foods/${food.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: food.name,
          checked: !food.checked, 
          usedToday: !food.checked ? food.usedToday : false 
        }),
        credentials: 'include',
      });
      if (response.ok) {
        fetchFoods();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleUsedToday = async (food) => {
    try {
      const response = await fetch(`https://kitchin-backend.onrender.com/api/foods/${food.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: food.name,
          checked: food.checked, 
          usedToday: !food.usedToday 
        }),
        credentials: 'include',
      });
      if (response.ok) {
        fetchFoods();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteFood = async (id) => {
    try {
      const response = await fetch(`https://kitchin-backend.onrender.com/api/foods/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        fetchFoods();
        showMessage('食材を削除しました');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    if (!menuText.trim()) {
      showMessage('メニュー内容を入力してください', true);
      return;
    }

    try {
      const response = await fetch('https://kitchin-backend.onrender.com/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, menuText }),
        credentials: 'include',
      });
      if (response.ok) {
        setMenuText('');
        fetchMenus();
        showMessage('今日の献立を保存しました！');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const shoppingList = foods.filter((food) => !food.checked);
  const fridgeList = foods.filter((food) => food.checked);
  const todayItems = foods.filter((food) => food.checked && food.usedToday);

  const groupedMenus = menus.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item.menuText);
    return acc;
  }, {});

  if (!isLoggedIn) {
    return (
      <div className="app-container" style={{ maxWidth: '400px', marginTop: '100px' }}>
        <h2 className="app-title">🏡 ログイン</h2>

        {message && (
          <div style={{
            padding: '10px 15px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: isError ? '#f8d7da' : '#d4edda',
            color: isError ? '#721c24' : '#155724',
            border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="card border-orange" style={{ padding: '20px' }}>
          <div className="input-group" style={{ marginBottom: '15px' }}>
            <label className="input-label">👤 ユーザー名</label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="例: family"
              required
              className="text-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label className="input-label">🔑 パスワード</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="パスワード"
              required
              className="text-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" className="submit-btn orange" style={{ width: '100%' }}>
            ログイン
          </button>
        </form>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '15px' }}>
          初期ID: family / パスワード: password
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 className="app-title" style={{ margin: 0 }}>🏡 KitchIN</h2>
        <button onClick={handleLogout} className="action-btn red" style={{ padding: '8px 15px' }}>
          🚪 ログアウト
        </button>
      </div>

      {message && (
        <div style={{
          padding: '10px 15px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: isError ? '#f8d7da' : '#d4edda',
          color: isError ? '#721c24' : '#155724',
          border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
          fontSize: '14px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}

      <div className="tab-container">
        <button
          onClick={() => setActiveTab('shopping')}
          className={`tab-button ${activeTab === 'shopping' ? 'shopping-active' : ''}`}
        >
          🛒 お買い物・冷蔵庫
        </button>
        <button
          onClick={() => setActiveTab('cooking')}
          className={`tab-button ${activeTab === 'cooking' ? 'cooking-active' : ''}`}
        >
          🍳 今日の献立
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`tab-button ${activeTab === 'history' ? 'history-active' : ''}`}
        >
          📜 献立履歴
        </button>
      </div>

      {activeTab === 'shopping' && (
        <div>
          <form onSubmit={addFood} className="input-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="➕ 追加したい食材 (例: 豚肉、キャベツ)"
              className="text-input"
            />
            <button type="submit" className="submit-btn orange">➕ 追加</button>
          </form>

          <div className="grid-container">
            <div className="card border-orange">
              <h3 className="card-title">🛒 買い物リスト</h3>
              <ul className="item-list">
                {shoppingList.length === 0 ? (
                  <p className="empty-text">✨ 買うものはありません</p>
                ) : (
                  shoppingList.map((food) => (
                    <li key={food.id} className="item-row">
                      <div className="item-left">
                        <input
                          type="checkbox"
                          checked={food.checked}
                          onChange={() => toggleFood(food)}
                          className="checkbox-style"
                        />
                        <span style={{ wordBreak: 'break-all' }}>{food.name}</span>
                      </div>
                      <button onClick={() => deleteFood(food.id)} className="action-btn red">
                        🗑️ 削除
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="card border-blue">
              <h3 className="card-title">❄️ 冷蔵庫の中身</h3>
              <ul className="item-list">
                {fridgeList.length === 0 ? (
                  <p className="empty-text">❄️ 冷蔵庫の中身はありません</p>
                ) : (
                  fridgeList.map((food) => (
                    <li key={food.id} className="item-row">
                      <div className="item-left">
                        <input
                          type="checkbox"
                          checked={food.checked}
                          onChange={() => toggleFood(food)}
                          className="checkbox-style"
                        />
                        <span style={{ wordBreak: 'break-all' }}>{food.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          onClick={() => toggleUsedToday(food)}
                          className={`action-btn ${food.usedToday ? 'yellow' : 'gray'}`}
                        >
                          {food.usedToday ? '⭐ 今日使う' : '＋ 今日使う'}
                        </button>
                        <button onClick={() => deleteFood(food.id)} className="action-btn red">
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cooking' && (
        <div className="stack-container">
          <div className="card border-green">
            <h3 className="card-title">🍳 献立の登録</h3>
            <form onSubmit={handleMenuSubmit}>
              <div className="input-group">
                <label className="input-label">📅 日付</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                  className="date-input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">🍲 メニュー内容</label>
                <input 
                  type="text" 
                  value={menuText} 
                  onChange={(e) => setMenuText(e.target.value)} 
                  placeholder="例: カレーライス、ポテトサラダ" 
                  required 
                  className="text-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" className="submit-btn green">💾 保存する</button>
            </form>
          </div>

          <div className="card border-yellow">
            <h3 className="card-title">🥕 今日使う食材（冷蔵庫から選択中）</h3>
            <ul className="item-list">
              {todayItems.length === 0 ? (
                <p className="empty-text" style={{ textAlign: 'left' }}>💡 「お買い物・冷蔵庫」タブで「今日使う」ボタンを押した食材がここに並びます</p>
              ) : (
                todayItems.map((item) => (
                  <li key={item.id} className="item-row">
                    <span style={{ fontWeight: 'bold', color: '#d35400', wordBreak: 'break-all' }}>{item.name}</span>
                    <button onClick={() => toggleUsedToday(item)} className="action-btn red">
                      ❌ 解除
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="stack-container">
          <div className="card border-purple">
            <h3 className="card-title">📜 過去の献立履歴</h3>
            <ul className="item-list">
              {Object.keys(groupedMenus).length === 0 ? (
                <p className="empty-text" style={{ textAlign: 'left' }}>📌 まだ履歴はありません</p>
              ) : (
                Object.keys(groupedMenus).map((menuDate) => (
                  <li key={menuDate} className="history-row">
                    <span className="history-date">📅 {menuDate}</span>
                    <span className="history-text">🍽️ {groupedMenus[menuDate].join('、')}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;