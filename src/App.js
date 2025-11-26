import React, { useState, useRef, useEffect } from "react";
import {
  User,
  ShieldCheck,
  History,
  Wallet,
  LogOut,
  PenTool,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  ChevronLeft,
  UserPlus,
  Search,
  Users,
  Mail,
  Phone,
  FileText,
  Eye,
  Calendar,
  Filter,
  PlusCircle,
  MinusCircle,
  Tag,
  Award,
  Gift,
  Hash,
  Clock,
  Save,
  Edit,
  Lock,
  Send,
  Loader,
  Ban,
  AlertTriangle,
  UserCheck,
  Download,
  Database,
  Trash2,
  Settings,
  Key,
  Link,
  Share2,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  where,
  limit,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// ==========================================
// 設定區域：請將此處換成您自己的 Firebase Config
// 您可以在 Firebase Console -> Project Settings -> General -> Your apps 下方找到
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB8WydXfzbP_2CQ9JNpnTfs89xq1D1WAdE",
  authDomain: "print-shop-ec0eb.firebaseapp.com",
  projectId: "print-shop-ec0eb",
  storageBucket: "print-shop-ec0eb.firebasestorage.app",
  messagingSenderId: "514900547270",
  appId: "1:514900547270:web:eb284a52aa0e50136f29c7",
  measurementId: "G-TGVRE1SMZX",
};
// ==========================================

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// 設定一個固定的 App ID，確保資料路徑一致
const appId = "print-shop-system";

// --- 工具函式 ---
const formatCurrency = (num) => {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(num);
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleString("zh-TW", { hour12: false });
};

const getMonthString = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
};

// --- 店內同事設定 ---
const STAFF_MEMBERS = ["BOSS", "YC", "PEI", "TING", "FAKER"];

// --- 常用項目設定 ---
const QUICK_ITEMS = [
  "A4 黑白列印",
  "A4 彩色列印",
  "A3 黑白列印",
  "A3 彩色列印",
  "掃描建檔",
  "膠裝",
  "騎馬釘",
  "大圖輸出",
];
const QUICK_AMOUNTS = [100, 500, 1000, 3000, 5000];

// --- 儲值方案設定 ---
const DEPOSIT_PLANS = [
  {
    id: "vip1",
    name: "一萬會員",
    base: 10000,
    bonus: 800,
    bgGradient: "from-amber-600 to-amber-700",
    textColor: "text-amber-50",
    iconColor: "text-amber-200",
  },
  {
    id: "vip3",
    name: "三萬會員",
    base: 30000,
    bonus: 3000,
    bgGradient: "from-slate-600 to-slate-700",
    textColor: "text-slate-50",
    iconColor: "text-slate-300",
  },
  {
    id: "vip5",
    name: "五萬會員",
    base: 50000,
    bonus: 6000,
    bgGradient: "from-yellow-600 to-yellow-700",
    textColor: "text-yellow-50",
    iconColor: "text-yellow-200",
  },
];

// --- Email 發送函式 (模擬) ---
const sendEmailReceipt = async (
  userEmail,
  userName,
  item,
  amount,
  type,
  balance
) => {
  if (!userEmail) return false;
  console.log("準備發送 Email 至:", userEmail);
  return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
};

// --- 主應用程式元件 ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [currentMember, setCurrentMember] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const [remoteParams, setRemoteParams] = useState(null);

  useEffect(() => {
    // 簡化登入邏輯，使用匿名登入
    signInAnonymously(auth).catch((error) => {
      console.error("Auth Error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const params = new URLSearchParams(window.location.search);
    const signMember = params.get("sign_member");
    const signOrder = params.get("sign_order");

    if (signMember && signOrder) {
      setRemoteParams({ memberId: signMember, orderId: signOrder });
      setView("remote_sign");
    }

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    if (view === "remote_sign") {
      window.location.href = window.location.pathname;
      return;
    }
    setView("login");
    setCurrentMember(null);
    setStaffData(null);
  };

  const handleLogin = async (role, inputId, inputPwd) => {
    if (!user) return false;

    if (role === "staff") {
      try {
        const authRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "settings",
          "staff_auth"
        );
        const authSnap = await getDoc(authRef);

        let validUsername = "admin";
        let validPassword = "admin";

        if (authSnap.exists()) {
          const data = authSnap.data();
          if (data.username) validUsername = data.username;
          if (data.password) validPassword = data.password;
        }

        if (inputId === validUsername && inputPwd === validPassword) {
          setStaffData({ name: "管理員" });
          setView("staff");
          return true;
        }
      } catch (e) {
        console.error("Staff login check failed", e);
        if (inputId === "admin" && inputPwd === "admin") {
          setStaffData({ name: "管理員(Fallback)" });
          setView("staff");
          return true;
        }
      }
    } else {
      try {
        const docRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "members",
          inputId
        );
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.password === inputPwd) {
            setCurrentMember({ id: docSnap.id, ...data });
            setView("member");
            return true;
          }
        }
      } catch (e) {
        console.error("Login error", e);
      }
    }
    return false;
  };

  if (view === "remote_sign" && remoteParams) {
    return (
      <RemoteSigningScreen
        memberId={remoteParams.memberId}
        orderId={remoteParams.orderId}
        firebaseUser={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
        <header className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-4 flex justify-between items-center shadow-md z-10 relative">
          {view !== "login" && (
            <button
              onClick={handleLogout}
              className="text-white hover:text-orange-100 transition mr-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-grow">
            <h1 className="font-bold text-lg tracking-wide">影城數位印刷</h1>
          </div>
          {view !== "login" && (
            <button
              onClick={handleLogout}
              className="text-xs bg-orange-900/50 hover:bg-orange-900 px-3 py-1 rounded transition ml-auto backdrop-blur-sm"
            >
              {view === "remote_sign" ? "離開" : "登出"}
            </button>
          )}
        </header>

        <main className="p-0">
          {view === "login" && <LoginScreen onLogin={handleLogin} />}

          {view === "member" && currentMember && (
            <MemberDashboard memberId={currentMember.id} firebaseUser={user} />
          )}

          {view === "staff" && <StaffDashboard firebaseUser={user} />}
        </main>
      </div>
    </div>
  );
}

// --- 遠端簽名專用畫面 ---
function RemoteSigningScreen({ memberId, orderId, firebaseUser }) {
  const [order, setOrder] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState("review");

  useEffect(() => {
    if (!firebaseUser) return;

    const fetchData = async () => {
      try {
        const memberRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "members",
          memberId
        );
        const memberSnap = await getDoc(memberRef);

        if (!memberSnap.exists()) {
          setError("找不到會員資料");
          setLoading(false);
          return;
        }
        setMemberData({ id: memberSnap.id, ...memberSnap.data() });

        const orderRef = doc(collection(memberRef, "history"), orderId);
        const unsubscribe = onSnapshot(orderRef, (docSnap) => {
          if (!docSnap.exists()) {
            setError("找不到此筆訂單");
            setLoading(false);
            return;
          }
          const data = docSnap.data();
          setOrder({ id: docSnap.id, ...data });
          setLoading(false);

          if (data.status === "completed") {
            setStep("success");
          }
        });

        return unsubscribe;
      } catch (e) {
        console.error(e);
        setError("讀取資料失敗");
        setLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser, memberId, orderId]);

  const handleRemoteSign = async (signatureData) => {
    if (!order || !memberData) return;
    try {
      setLoading(true);
      const memberRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "members",
        memberId
      );
      const orderRef = doc(collection(memberRef, "history"), order.id);

      await updateDoc(orderRef, {
        status: "completed",
        signature: signatureData,
        signDate: getCurrentTime(),
        signTimestamp: Date.now(),
        signMethod: "remote",
      });

      const finalBalance =
        order.type === "deposit"
          ? memberData.balance + order.amount
          : memberData.balance - order.amount;

      await updateDoc(memberRef, {
        balance: finalBalance,
      });

      await sendEmailReceipt(
        memberData.email,
        memberData.name,
        order.item,
        order.amount,
        order.type,
        finalBalance
      );

      setStep("success");
    } catch (e) {
      console.error("Sign error", e);
      alert("簽核失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center">
        <Loader className="w-8 h-8 animate-spin mx-auto text-orange-500" />
        <p className="mt-4 text-slate-500">載入訂單資料中...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-10 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 font-bold">{error}</p>
        <p className="text-sm text-slate-400 mt-2">請確認連結是否正確</p>
      </div>
    );

  if (step === "success") {
    return (
      <div className="p-8 text-center pt-20 h-full bg-slate-50">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">訂單已簽核！</h2>
        <p className="text-slate-600 mb-8">
          感謝您的確認，我們將盡快為您處理。
        </p>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-left space-y-2">
          <p className="text-sm text-slate-500">訂單項目</p>
          <p className="font-bold text-slate-800">{order.item}</p>
          <div className="border-t my-2"></div>
          <p className="text-sm text-slate-500">金額</p>
          <p
            className={`font-bold text-xl ${
              order.type === "expense" ? "text-orange-600" : "text-green-600"
            }`}
          >
            {order.type === "expense" ? "-" : "+"}
            {formatCurrency(order.amount)}
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-8">您可以關閉此視窗</p>
      </div>
    );
  }

  if (step === "signing") {
    return (
      <SignaturePad
        amount={order.amount.toString()}
        item={order.item}
        user={memberData}
        type={order.type}
        onConfirm={handleRemoteSign}
        onCancel={() => setStep("review")}
      />
    );
  }

  return (
    <div className="p-6 bg-slate-50 h-full">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
        <div className="bg-orange-600 p-6 text-white">
          <h2 className="text-xl font-bold mb-1">待簽核訂單</h2>
          <p className="text-orange-100 text-sm">請確認以下交易內容</p>
        </div>
        <div className="p-6 space-y-6">
          {/* 新增：明確顯示會員名稱 */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              會員名稱
            </label>
            <p className="text-lg font-bold text-slate-800 mt-1">
              {memberData.name}
            </p>
          </div>

          <div className="border-t border-slate-100"></div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              交易項目
            </label>
            <p className="text-lg font-bold text-slate-800 mt-1">
              {order.item}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                {order.date}
              </span>
              {order.staff && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                  經手: {order.staff}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              交易金額
            </label>
            <p
              className={`text-3xl font-bold mt-1 ${
                order.type === "expense" ? "text-orange-600" : "text-green-600"
              }`}
            >
              {order.type === "expense" ? "-" : "+"}
              {formatCurrency(order.amount)}
            </p>
          </div>

          <button
            onClick={() => setStep("signing")}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <PenTool className="w-5 h-5" />
            前往簽名
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-6">
        影城數位印刷 電子簽核系統
      </p>
    </div>
  );
}

// --- 登入畫面 ---
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("member");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await onLogin(role, username, password);
    setLoading(false);
    if (!success) {
      setError("帳號或密碼錯誤");
    }
  };

  useEffect(() => {
    setUsername("");
    setPassword("");
    setError("");
  }, [role]);

  return (
    <div className="p-6 flex flex-col justify-center h-[80vh]">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">歡迎回來</h2>
        <p className="text-slate-500">請登入您的帳戶</p>
      </div>

      <div className="bg-orange-50 p-1 rounded-lg flex mb-6 border border-orange-100">
        <button
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            role === "member"
              ? "bg-white shadow text-orange-600"
              : "text-orange-400 hover:text-orange-500"
          }`}
          onClick={() => setRole("member")}
        >
          <User className="w-4 h-4 inline mr-1" /> 會員登入
        </button>
        <button
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            role === "staff"
              ? "bg-white shadow text-orange-600"
              : "text-orange-400 hover:text-orange-500"
          }`}
          onClick={() => setRole("staff")}
        >
          <ShieldCheck className="w-4 h-4 inline mr-1" /> 店員後台
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {role === "member" ? "會員帳號" : "店員帳號"}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder={
              role === "member" ? "請輸入會員帳號" : "請輸入後台帳號"
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            密碼
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-bold shadow-lg transition transform active:scale-95 bg-orange-600 hover:bg-orange-700 flex justify-center items-center`}
        >
          {loading ? "登入中..." : "登入系統"}
        </button>
      </form>
    </div>
  );
}

// --- 會員儀表板 ---
function MemberDashboard({ memberId, firebaseUser }) {
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [viewingSignature, setViewingSignature] = useState(null);

  useEffect(() => {
    if (!firebaseUser || !memberId) return;

    const docRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "members",
      memberId
    );
    const unsubDoc = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    const historyRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "members",
      memberId,
      "history"
    );
    const unsubHistory = onSnapshot(historyRef, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(list);
    });

    return () => {
      unsubDoc();
      unsubHistory();
    };
  }, [firebaseUser, memberId]);

  if (!userData) return <div className="p-8 text-center">載入中...</div>;

  const availableMonths = Array.from(
    new Set(
      history
        .filter((h) => h.status !== "pending" && h.status !== "voided")
        .map((h) => getMonthString(h.timestamp))
    )
  );

  const filteredHistory = history.filter((h) => {
    if (h.status === "pending") return false;
    if (h.status === "voided") return false;
    if (selectedMonth === "all") return true;
    return getMonthString(h.timestamp) === selectedMonth;
  });

  return (
    <div className="pb-20 bg-slate-50 min-h-screen relative">
      {viewingSignature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
          onClick={() => setViewingSignature(null)}
        >
          <div
            className="bg-white p-4 rounded-xl max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800">簽名確認圖檔</h3>
              <button onClick={() => setViewingSignature(null)}>
                <XCircle className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded p-2 flex justify-center">
              <img
                src={viewingSignature}
                alt="簽名預覽"
                className="max-h-60 object-contain"
              />
            </div>
            <button
              onClick={() => setViewingSignature(null)}
              className="w-full mt-4 py-2 bg-slate-800 text-white rounded-lg"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      <div className="relative pt-6 px-4 mb-8">
        <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl shadow-2xl p-6 text-white overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-[-30px] left-[-10px] w-40 h-40 bg-yellow-400/10 rounded-full blur-xl"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 text-orange-100 text-sm mb-1 opacity-80">
                  <CreditCard className="w-4 h-4" />
                  <span>會員儲值卡</span>
                </div>
                <h2 className="text-2xl font-bold tracking-wide">
                  {userData.name}
                </h2>
              </div>
              <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md opacity-90 border border-yellow-600/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute w-[1px] h-full bg-yellow-600/40 left-1/3"></div>
                <div className="absolute w-[1px] h-full bg-yellow-600/40 right-1/3"></div>
                <div className="absolute w-full h-[1px] bg-yellow-600/40 top-1/2"></div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-orange-100 text-xs mb-1 opacity-80 uppercase tracking-wider">
                目前餘額
              </p>
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-sm font-mono">
                {formatCurrency(userData.balance)}
              </h1>
            </div>

            <div className="bg-black/10 rounded-xl p-3 text-sm space-y-2 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-orange-50">
                <Users className="w-3.5 h-3.5 opacity-70" />
                <span className="opacity-70 text-xs w-16">會員編號</span>
                <span className="font-mono tracking-wider">{memberId}</span>
              </div>
              {userData.paperId && (
                <div className="flex items-center gap-2 text-orange-50">
                  <Hash className="w-3.5 h-3.5 opacity-70" />
                  <span className="opacity-70 text-xs w-16">紙本編號</span>
                  <span className="font-mono tracking-wider">
                    {userData.paperId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-orange-600" />
            歷史訂單
          </h3>

          <div className="relative">
            <div className="absolute left-2 top-1.5 pointer-events-none">
              <Filter className="w-3 h-3 text-slate-500" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-7 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-full text-slate-600 shadow-sm focus:outline-none focus:border-orange-500 appearance-none"
            >
              <option value="all">全部月份</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-100">
              <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm">此期間尚無交易紀錄</p>
            </div>
          ) : (
            filteredHistory.map((record) => {
              return (
                <div
                  key={record.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1.5 h-10 rounded-full ${
                        record.type === "deposit"
                          ? "bg-green-500"
                          : "bg-orange-400"
                      }`}
                    ></div>
                    <div>
                      <p className="font-bold text-slate-800">{record.item}</p>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        {record.date}
                        {record.type === "expense" && (
                          <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-400 border">
                            已簽核
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          record.type === "deposit"
                            ? "text-green-600"
                            : "text-slate-700"
                        }`}
                      >
                        {record.type === "deposit" ? "+" : "-"}
                        {formatCurrency(record.amount)}
                      </p>
                    </div>

                    {record.signature && (
                      <button
                        onClick={() => setViewingSignature(record.signature)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition"
                        title="查看簽名"
                      >
                        <PenTool className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// --- 店員後台 ---
function StaffDashboard({ firebaseUser }) {
  const [mode, setMode] = useState("list");
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = collection(db, "artifacts", appId, "public", "data", "members");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMembers(list);
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  const filteredMembers = members.filter(
    (m) =>
      m.name.includes(searchTerm) ||
      m.id.includes(searchTerm) ||
      (m.paperId && m.paperId.toString().includes(searchTerm))
  );

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setMode("member_detail");
  };

  const handleBackupClick = () => {
    setShowBackupConfirm(true);
  };

  const executeBackup = async () => {
    setShowBackupConfirm(false);
    setIsExporting(true);
    try {
      const membersRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "members"
      );
      const membersSnap = await getDocs(membersRef);

      const allData = [];

      await Promise.all(
        membersSnap.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          const historyRef = collection(memberDoc.ref, "history");
          const historySnap = await getDocs(historyRef);
          const historyData = historySnap.docs.map((h) => h.data());

          allData.push({
            id: memberDoc.id,
            ...memberData,
            history: historyData,
          });
        })
      );

      const exportObj = {
        backupDate: new Date().toISOString(),
        system: "影城數位印刷會員系統",
        totalMembers: allData.length,
        data: allData,
      };

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute(
        "download",
        `backup_print_shop_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      alert("備份檔案下載完成！請妥善保存。");
    } catch (e) {
      console.error("Backup failed", e);
      alert("備份失敗，請檢查網路連線");
    }
    setIsExporting(false);
  };

  if (mode === "create") {
    return (
      <CreateMemberForm members={members} onCancel={() => setMode("list")} />
    );
  }

  if (mode === "member_detail" && selectedMember) {
    return (
      <MemberControlPanel
        targetUser={selectedMember}
        onBack={() => {
          setSelectedMember(null);
          setMode("list");
        }}
      />
    );
  }

  return (
    <div className="p-6 relative">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {showBackupConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={() => setShowBackupConfirm(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <Database className="w-6 h-6" />
              <h3 className="font-bold text-lg">確認資料備份？</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              您即將下載全系統資料庫備份檔（JSON格式）。
              <br />
              <span className="text-xs text-slate-400 mt-1 block">
                包含所有會員資料與歷史交易紀錄，請妥善保存此檔案。
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackupConfirm(false)}
                className="flex-1 py-2 border rounded-lg text-slate-500 hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                onClick={executeBackup}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow"
              >
                確認下載
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-800">
          會員列表 ({members.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-slate-200 transition"
            title="後台設定"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleBackupClick}
            disabled={isExporting}
            className="bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 shadow hover:bg-slate-700 disabled:bg-slate-400"
          >
            {isExporting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "打包" : "備份"}
          </button>
          <button
            onClick={() => setMode("create")}
            className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 shadow hover:bg-orange-700"
          >
            <UserPlus className="w-4 h-4" /> 新增
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="搜尋姓名、統編、帳號或紙本編號..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      <div className="space-y-3 pb-20">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            onClick={() => handleSelectMember(member)}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center transition group hover:border-orange-300 cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-slate-100 p-2 rounded-full group-hover:bg-orange-50 transition-colors">
                <User className="w-5 h-5 text-slate-600 group-hover:text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  {member.name}
                  {member.paperId && (
                    <span className="text-slate-400 text-xs font-normal ml-1">
                      (#{member.paperId})
                    </span>
                  )}
                </p>
                <p className="text-xs text-orange-600 font-bold">
                  {formatCurrency(member.balance)}
                </p>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-orange-400">
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <p className="text-center text-slate-400 py-10">找不到會員</p>
        )}
      </div>
    </div>
  );
}

// --- 設定 Modal ---
function SettingsModal({ onClose }) {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const authRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "settings",
          "staff_auth"
        );
        const snap = await getDoc(authRef);
        if (snap.exists()) {
          setNewUsername(snap.data().username || "admin");
          setNewPassword(snap.data().password || "admin");
        } else {
          setNewUsername("admin");
          setNewPassword("admin");
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!newUsername || !newPassword) {
      alert("帳號與密碼不能為空");
      return;
    }
    setIsLoading(true);
    try {
      const authRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "settings",
        "staff_auth"
      );
      await setDoc(authRef, {
        username: newUsername,
        password: newPassword,
        updatedAt: Date.now(),
      });
      alert("後台登入資料已更新！下次登入請使用新帳密。");
      onClose();
    } catch (e) {
      console.error(e);
      alert("更新失敗");
    }
    setIsLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4 text-slate-800 border-b pb-2">
          <Settings className="w-6 h-6 text-slate-500" />
          <h3 className="font-bold text-lg">後台系統設定</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              修改店員登入帳號
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              修改店員登入密碼
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <p className="text-[10px] text-red-400 mt-1">* 請妥善保管此密碼</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg text-slate-500 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 會員控制面板 ---
function MemberControlPanel({ targetUser: initialUser, onBack }) {
  const [targetUser, setTargetUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState("actions");
  const [viewMode, setViewMode] = useState("dashboard");
  const [transactType, setTransactType] = useState("expense");
  const [pendingItems, setPendingItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [pendingItemToSign, setPendingItemToSign] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [viewingSignature, setViewingSignature] = useState(null);
  const [resendingEmailId, setResendingEmailId] = useState(null);
  const [voidConfirmRecord, setVoidConfirmRecord] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 新增：刪除確認視窗

  // 取得當前基礎網址 (更安全的寫法，避免預覽環境出錯)
  const getBaseUrl = () => {
    return window.location.href.split("?")[0];
  };

  useEffect(() => {
    const docRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "members",
      initialUser.id
    );
    const unsub = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setTargetUser({ id: doc.id, ...doc.data() });
      }
    });
    return () => unsub();
  }, [initialUser.id]);

  useEffect(() => {
    const historyRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "members",
      targetUser.id,
      "history"
    );
    const unsub = onSnapshot(historyRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const pending = list.filter((item) => item.status === "pending");
      pending.sort((a, b) => a.timestamp - b.timestamp);
      setPendingItems(pending);

      const completed = list.filter((item) => item.status !== "pending");
      completed.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(completed);
    });
    return () => unsub();
  }, [targetUser.id]);

  const startEditing = () => {
    setEditFormData({
      name: targetUser.name,
      contactPhone: targetUser.contactPhone || "",
      email: targetUser.email || "",
      taxId: targetUser.taxId || "",
      paperId: targetUser.paperId || "",
      password: targetUser.password || "",
    });
    setIsEditing(true);
  };

  const saveMemberInfo = async () => {
    if (!editFormData.name) {
      alert("會員名稱為必填");
      return;
    }
    try {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "members",
        targetUser.id
      );
      await updateDoc(docRef, {
        ...editFormData,
      });
      setIsEditing(false);
      alert("資料更新成功");
    } catch (e) {
      console.error("Update failed", e);
      alert("更新失敗");
    }
  };

  // 刪除會員功能
  const handleDeleteMember = async () => {
    try {
      const memberRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "members",
        targetUser.id
      );
      const historyCollectionRef = collection(memberRef, "history");

      // 1. 先讀取所有歷史紀錄 (Firestore 刪除文件不會自動刪除子集合)
      const historySnapshot = await getDocs(historyCollectionRef);
      const batch = writeBatch(db);

      // 2. 批次刪除所有歷史紀錄
      historySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. 刪除會員主文件
      batch.delete(memberRef);

      // 4. 執行
      await batch.commit();

      alert("會員及其所有資料已刪除。");
      onBack(); // 回到列表
    } catch (e) {
      console.error("Delete member error", e);
      alert("刪除失敗，請檢查網路連線或聯絡管理員。");
    }
  };

  const handleResendEmail = async (recordId) => {
    if (!targetUser.email) {
      alert("該會員未設定 Email，無法發送消費清單。");
      return;
    }
    setResendingEmailId(recordId);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setResendingEmailId(null);
    alert(`消費清單已重新發送至 ${targetUser.email}`);
  };

  // 觸發作廢 (顯示模態視窗)
  const handleVoidTransactionClick = (record) => {
    setVoidConfirmRecord(record);
  };

  // 執行作廢 (後端邏輯)
  const confirmVoid = async () => {
    if (!voidConfirmRecord) return;
    const record = voidConfirmRecord;
    setVoidConfirmRecord(null); // 關閉視窗

    try {
      const memberRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "members",
        targetUser.id
      );
      const recordRef = doc(collection(memberRef, "history"), record.id);

      const balanceAdjustment =
        record.type === "expense" ? record.amount : -record.amount;
      const newBalance = targetUser.balance + balanceAdjustment;

      await updateDoc(recordRef, {
        status: "voided",
        voidedAt: getCurrentTime(),
        voidedTimestamp: Date.now(),
      });

      await updateDoc(memberRef, {
        balance: newBalance,
      });
    } catch (e) {
      console.error("Void error", e);
      alert("作廢失敗，請檢查網路連線。");
    }
  };

  // 複製簽核連結功能
  const handleCopySignLink = (recordId) => {
    // 構建完整的簽核網址 (使用新的安全抓取法)
    const baseUrl = getBaseUrl();
    const signUrl = `${baseUrl}?sign_member=${targetUser.id}&sign_order=${recordId}`;

    // 複製到剪貼簿
    navigator.clipboard
      .writeText(signUrl)
      .then(() => {
        alert("✅ 簽核連結已複製！請傳送給客戶簽名。\n\n連結預覽:\n" + signUrl);
      })
      .catch(() => {
        // 備用方案
        const tempInput = document.createElement("input");
        tempInput.value = signUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        alert("✅ 簽核連結已複製！請傳送給客戶簽名。");
      });
  };

  // 傳遞 staff 參數
  const handleTransactionProcess = async (
    amount,
    item,
    signatureData,
    type,
    pendingDocId = null,
    staff
  ) => {
    try {
      const memberRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "members",
        targetUser.id
      );
      const historyCollectionRef = collection(memberRef, "history");

      let finalBalance = targetUser.balance;

      if (pendingDocId) {
        const docRef = doc(historyCollectionRef, pendingDocId);
        await updateDoc(docRef, {
          status: "completed",
          signature: signatureData,
          signDate: getCurrentTime(),
          signTimestamp: Date.now(),
          staff: staff, // 更新簽核人員
        });
      } else {
        const status = signatureData ? "completed" : "pending";
        await addDoc(historyCollectionRef, {
          date: getCurrentTime(),
          timestamp: Date.now(),
          item: item,
          amount: amount,
          type: type,
          status: status,
          signature: signatureData || null,
          staff: staff, // 儲存經手人員
        });
      }

      if (signatureData) {
        finalBalance =
          type === "deposit"
            ? targetUser.balance + amount
            : targetUser.balance - amount;
        await updateDoc(memberRef, { balance: finalBalance });

        await sendEmailReceipt(
          targetUser.email,
          targetUser.name,
          item,
          amount,
          type,
          finalBalance
        );
      }

      return true;
    } catch (e) {
      console.error("Transaction failed", e);
      return false;
    }
  };

  const startNewTransaction = (type) => {
    setTransactType(type);
    setPendingItemToSign(null);
    setViewMode("transact");
  };

  const startSignPending = (item) => {
    setTransactType(item.type);
    setPendingItemToSign(item);
    setViewMode("transact");
  };

  if (viewMode === "transact") {
    return (
      <TransactionFlow
        targetUser={targetUser}
        initialType={transactType}
        initialData={pendingItemToSign}
        onProcessTransaction={handleTransactionProcess}
        onBack={() => setViewMode("dashboard")}
      />
    );
  }

  return (
    <div className="p-6 pb-24 relative">
      {/* 作廢確認 Modal */}
      {voidConfirmRecord && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={() => setVoidConfirmRecord(null)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">確認作廢交易？</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              您即將作廢「
              <span className="font-bold text-slate-800">
                {voidConfirmRecord.item}
              </span>
              」。
              <br />
              金額：
              <span className="font-mono font-bold">
                {formatCurrency(voidConfirmRecord.amount)}
              </span>
              <br />
              <span className="text-xs text-red-500 mt-2 block">
                此操作無法復原，且會直接影響會員餘額。
              </span>
            </p>

            {/* 餘額預警 */}
            {voidConfirmRecord.type === "deposit" &&
              targetUser.balance - voidConfirmRecord.amount < 0 && (
                <div className="bg-red-50 text-red-700 text-xs p-2 rounded mb-4 border border-red-100 font-bold">
                  警告：作廢此儲值將導致餘額變為負數！
                </div>
              )}

            <div className="flex gap-3">
              <button
                onClick={() => setVoidConfirmRecord(null)}
                className="flex-1 py-2 border rounded-lg text-slate-500 hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                onClick={confirmVoid}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow"
              >
                確認作廢
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除會員確認 Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">危險：確認刪除會員？</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              您即將永久刪除會員「
              <span className="font-bold text-slate-800">
                {targetUser.name}
              </span>
              」。
              <br />
              <span className="text-xs text-red-500 mt-2 block">
                此操作將同時移除該會員的所有交易歷史、餘額紀錄，且無法復原！
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border rounded-lg text-slate-500 hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleDeleteMember}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="text-slate-500 flex items-center gap-1 hover:text-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> 返回列表
        </button>
        <div className="text-xs text-slate-400">ID: {targetUser.id}</div>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded-lg mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3 border-b pb-3">
          <div className="bg-slate-100 p-2 rounded-full">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">{targetUser.name}</p>
            {targetUser.paperId && (
              <p className="text-xs text-slate-500">
                紙本編號: {targetUser.paperId}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">目前餘額</span>
          <span className="font-bold text-slate-800 text-xl">
            {formatCurrency(targetUser.balance)}
          </span>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex-1 py-2 text-sm font-bold rounded transition ${
            activeTab === "actions"
              ? "bg-white shadow text-slate-800"
              : "text-slate-400"
          }`}
        >
          交易操作
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 text-sm font-bold rounded transition ${
            activeTab === "history"
              ? "bg-white shadow text-slate-800"
              : "text-slate-400"
          }`}
        >
          歷史紀錄
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2 text-sm font-bold rounded transition ${
            activeTab === "info"
              ? "bg-white shadow text-slate-800"
              : "text-slate-400"
          }`}
        >
          基本資料
        </button>
      </div>

      {activeTab === "actions" && (
        <>
          {pendingItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1 animate-pulse">
                <Clock className="w-4 h-4" /> 待補簽核項目 (
                {pendingItems.length})
              </h3>
              <div className="space-y-2">
                {pendingItems.map((item) => {
                  // 預先計算連結，用於顯示
                  const itemSignUrl = `${getBaseUrl()}?sign_member=${
                    targetUser.id
                  }&sign_order=${item.id}`;

                  return (
                    <div
                      key={item.id}
                      className="bg-red-50 border border-red-100 p-3 rounded-lg flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                item.type === "deposit"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {item.type === "deposit" ? "儲值" : "消費"}
                            </span>
                            <span className="font-bold text-slate-700">
                              {item.item}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <span>{item.date} 建立</span>
                            {item.staff && (
                              <span className="bg-slate-200 px-1 rounded text-slate-600">
                                {item.staff}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-slate-700">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleCopySignLink(item.id)}
                          className="flex-1 bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-50 active:bg-slate-100 transition"
                        >
                          <Link className="w-3 h-3" /> 複製連結
                        </button>
                        <button
                          onClick={() => startSignPending(item)}
                          className="flex-1 bg-red-600 text-white px-2 py-1.5 rounded text-xs font-bold shadow hover:bg-red-700 flex items-center justify-center gap-1"
                        >
                          <PenTool className="w-3 h-3" /> 現場簽核
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h3 className="font-bold text-lg text-slate-800 mb-3">建立新交易</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => startNewTransaction("expense")}
              className="flex flex-col items-center justify-center gap-2 bg-white border border-orange-200 p-6 rounded-xl shadow-sm hover:bg-orange-50 transition group"
            >
              <div className="bg-orange-100 p-3 rounded-full group-hover:bg-orange-200 text-orange-600">
                <MinusCircle className="w-6 h-6" />
              </div>
              <span className="font-bold text-orange-800">消費扣款</span>
            </button>
            <button
              onClick={() => startNewTransaction("deposit")}
              className="flex flex-col items-center justify-center gap-2 bg-white border border-green-200 p-6 rounded-xl shadow-sm hover:bg-green-50 transition group"
            >
              <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 text-green-600">
                <PlusCircle className="w-6 h-6" />
              </div>
              <span className="font-bold text-green-800">餘額儲值</span>
            </button>
          </div>
        </>
      )}

      {/* 其他 Tab 內容保持不變 */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {viewingSignature && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-fade-in"
              onClick={() => setViewingSignature(null)}
            >
              <div
                className="bg-white p-4 rounded-xl max-w-sm w-full relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-bold text-slate-800">簽名確認圖檔</h3>
                  <button onClick={() => setViewingSignature(null)}>
                    <XCircle className="text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded p-2 flex justify-center">
                  <img
                    src={viewingSignature}
                    alt="Signature"
                    className="max-h-60 object-contain"
                  />
                </div>
                <button
                  onClick={() => setViewingSignature(null)}
                  className="w-full mt-4 py-2 bg-slate-800 text-white rounded-lg"
                >
                  關閉
                </button>
              </div>
            </div>
          )}
          {history.length === 0 ? (
            <p className="text-slate-400 text-center py-10">無歷史紀錄</p>
          ) : (
            history.map((record) => {
              const isVoided = record.status === "voided";
              return (
                <div
                  key={record.id}
                  className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center ${
                    isVoided ? "bg-slate-50 opacity-70" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1 h-8 rounded-full ${
                        record.type === "deposit"
                          ? isVoided
                            ? "bg-slate-400"
                            : "bg-green-500"
                          : isVoided
                          ? "bg-slate-400"
                          : "bg-orange-400"
                      }`}
                    ></div>
                    <div>
                      <p
                        className={`font-bold text-slate-800 text-sm ${
                          isVoided ? "line-through decoration-slate-400" : ""
                        }`}
                      >
                        {record.item}
                      </p>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        {record.date}
                        {record.staff && (
                          <span className="bg-slate-100 px-1 rounded text-slate-600 font-medium">
                            @{record.staff}
                          </span>
                        )}
                        {isVoided && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold border border-red-200">
                            已作廢
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p
                      className={`font-bold text-sm ${
                        isVoided
                          ? "line-through text-slate-400"
                          : record.type === "deposit"
                          ? "text-green-600"
                          : "text-slate-700"
                      }`}
                    >
                      {record.type === "deposit" ? "+" : "-"}
                      {formatCurrency(record.amount)}
                    </p>
                    <div className="flex items-center gap-2">
                      {record.signature && !isVoided && (
                        <button
                          onClick={() => setViewingSignature(record.signature)}
                          className={`text-[10px] hover:underline flex items-center gap-1 ${
                            record.signMethod === "remote"
                              ? "text-purple-600 font-bold"
                              : "text-blue-500"
                          }`}
                        >
                          <Eye className="w-3 h-3" />{" "}
                          {record.signMethod === "remote"
                            ? "查看 (遠端)"
                            : "查看"}
                        </button>
                      )}
                      {!isVoided && (
                        <button
                          onClick={() => handleVoidTransactionClick(record)}
                          className="text-[10px] border rounded px-1.5 py-0.5 flex items-center gap-1 text-red-500 hover:bg-red-50 hover:border-red-200 transition"
                        >
                          <Ban className="w-3 h-3" /> 作廢
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "info" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-10">
          {/* ... info tab content ... */}
          {!isEditing ? (
            <>
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700">詳細資料</h3>
                <button
                  onClick={startEditing}
                  className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4" /> 修改資料
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-slate-500 col-span-1">會員名稱</span>
                  <span className="text-slate-800 font-bold col-span-2">
                    {targetUser.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-slate-500 col-span-1">紙本編號</span>
                  <span className="text-slate-800 col-span-2">
                    {targetUser.paperId || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-slate-500 col-span-1">聯絡電話</span>
                  <span className="text-slate-800 col-span-2">
                    {targetUser.contactPhone || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-slate-500 col-span-1">電子信箱</span>
                  <span className="text-slate-800 col-span-2 break-all">
                    {targetUser.email || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-slate-500 col-span-1">統一編號</span>
                  <span className="text-slate-800 col-span-2">
                    {targetUser.taxId || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-slate-500 col-span-1">登入密碼</span>
                  <span className="text-slate-800 col-span-2">
                    {targetUser.password}
                  </span>
                </div>
              </div>

              {/* 刪除會員按鈕 */}
              <div className="p-4 border-t bg-slate-50">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border border-red-200 text-red-600 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" /> 刪除此會員
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm border-b pb-2 mb-2">
                <Edit className="w-4 h-4" /> 編輯會員資料
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  會員名稱
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  紙本編號
                </label>
                <input
                  type="text"
                  value={editFormData.paperId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      paperId: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  聯絡電話
                </label>
                <input
                  type="text"
                  value={editFormData.contactPhone}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      contactPhone: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  電子信箱
                </label>
                <input
                  type="text"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  統一編號
                </label>
                <input
                  type="text"
                  value={editFormData.taxId}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, taxId: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 重設密碼
                </label>
                <input
                  type="text"
                  value={editFormData.password}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      password: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded text-sm bg-yellow-50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 border rounded text-slate-600 text-sm font-bold"
                >
                  取消
                </button>
                <button
                  onClick={saveMemberInfo}
                  className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-bold"
                >
                  儲存變更
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- 新增會員表單 ---
function CreateMemberForm({ members, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    accountId: "",
    paperId: "",
    balance: 0,
    password: "",
    contactPhone: "",
    taxId: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);

  // 自動計算下一個紙本編號 (優化版：防止崩潰與不必要的覆蓋)
  useEffect(() => {
    let maxId = 0;
    try {
      if (members && Array.isArray(members) && members.length > 0) {
        members.forEach((m) => {
          if (
            m.paperId &&
            typeof m.paperId === "string" &&
            m.paperId.startsWith("NO.")
          ) {
            const num = parseInt(m.paperId.replace("NO.", ""), 10);
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        });
      }
      const nextId = `NO.${String(maxId + 1).padStart(3, "0")}`;

      // 僅在 paperId 為空或明顯是自動生成的格式時才更新，避免覆蓋使用者手輸的內容
      setFormData((prev) => {
        if (
          !prev.paperId ||
          (prev.paperId.startsWith("NO.") && prev.paperId !== nextId)
        ) {
          return { ...prev, paperId: nextId };
        }
        return prev;
      });
    } catch (e) {
      console.error("Error calculating paperId:", e);
    }
  }, [members]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. 必填欄位檢查
    if (
      !formData.name ||
      !formData.accountId ||
      !formData.password ||
      !formData.contactPhone ||
      !formData.email
    ) {
      alert("請填寫所有必填欄位 (*)！");
      return;
    }

    // 2. 帳號 ID 格式檢查 (簡單過濾空格)
    const safeAccountId = formData.accountId.trim();
    if (!safeAccountId) {
      alert("帳號 ID 不能為空或只有空白");
      return;
    }

    setLoading(true);
    try {
      // 3. 檢查 ID 是否已存在 (防止覆蓋)
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "members",
        safeAccountId
      );

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        alert(`錯誤：帳號 ID "${safeAccountId}" 已經存在！請使用其他 ID。`);
        setLoading(false);
        return;
      }

      // 4. 寫入會員資料
      const initialBalance = parseInt(formData.balance) || 0; // 確保是數字

      await setDoc(docRef, {
        name: formData.name,
        balance: initialBalance,
        password: formData.password,
        id: safeAccountId,
        paperId: formData.paperId || "",
        contactPhone: formData.contactPhone,
        taxId: formData.taxId || "",
        email: formData.email,
        createdAt: Date.now(),
      });

      // 5. 如果有初始餘額，寫入歷史紀錄
      if (initialBalance > 0) {
        const historyRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "members",
          safeAccountId,
          "history"
        );
        // 初始餘額設為 completed (無需簽名)
        await addDoc(historyRef, {
          date: getCurrentTime(),
          timestamp: Date.now(),
          item: "初始餘額建檔",
          amount: initialBalance,
          type: "deposit",
          status: "completed",
          signature: null,
          staff: "系統建檔",
        });
      }

      alert("會員建立成功！");
      onCancel();
    } catch (e) {
      console.error("Create member failed:", e);
      alert(`建立失敗：${e.message || "請檢查網路連線"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={onCancel}
        className="text-slate-500 mb-4 flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" /> 返回列表
      </button>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">新增會員建檔</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Block 1: 會員基本資料 (Name, Phone, Email) */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            會員基本資料
          </h3>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                會員名稱 / 公司抬頭 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="例如：王小明 或 影城印刷有限公司"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  聯絡電話 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="手機或分機"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  電子信箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: 系統與帳務設定 (System & ID) */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            系統與帳務設定
          </h3>
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  登入帳號 ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="會員登入用帳號"
                  value={formData.accountId}
                  onChange={(e) =>
                    setFormData({ ...formData, accountId: e.target.value })
                  }
                  required
                />
                <div className="text-xs text-slate-500 mt-1">
                  請輸入唯一識別碼 (如統編、手機)
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  預設密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="0000"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <div className="text-xs text-slate-500 mt-1">
                  建議預設為 0000
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-orange-200/50 my-2"></div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  紙本檔案編號 (自動)
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg bg-slate-100 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-slate-600"
                  value={formData.paperId}
                  onChange={(e) =>
                    setFormData({ ...formData, paperId: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  初始餘額
                </label>
                <input
                  type="number"
                  className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({ ...formData, balance: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                統一編號 (選填)
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="8碼統編"
                value={formData.taxId}
                onChange={(e) =>
                  setFormData({ ...formData, taxId: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold mt-4 shadow-md hover:bg-orange-700 transition"
        >
          {loading ? "儲存中..." : "建立會員資料"}
        </button>
      </form>
    </div>
  );
}

// --- 交易流程 (支援待簽核與Email發送) ---
function TransactionFlow({
  targetUser,
  initialType,
  initialData,
  onProcessTransaction,
  onBack,
}) {
  const isSigningPending = !!initialData;

  const [type, setType] = useState(initialType || "expense");
  const [amount, setAmount] = useState(initialData ? initialData.amount : "");
  const [item, setItem] = useState(initialData ? initialData.item : "");
  const [step, setStep] = useState("input");
  const [error, setError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(
    initialData ? initialData.staff : ""
  ); // 新增 staff state
  const [isEmailSending, setIsEmailSending] = useState(false);

  const handleCreateOrder = (saveAsPending = false) => {
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      setError("請輸入有效金額");
      return;
    }
    if (!item.trim()) {
      setError("請輸入項目名稱");
      return;
    }
    if (type === "expense" && parseInt(amount) > targetUser.balance) {
      setError("餘額不足！");
      return;
    }
    // 檢查經手人員
    if (!selectedStaff) {
      setError("請選擇經手人員");
      return;
    }

    if (saveAsPending) {
      handleSavePending();
    } else {
      setError("");
      setStep("confirm");
    }
  };

  const handleSavePending = async () => {
    // 傳入 staff
    const success = await onProcessTransaction(
      parseInt(amount),
      item,
      null,
      type,
      null,
      selectedStaff
    );
    if (success) {
      alert("已建立待簽單，請客戶之後補簽名確認。");
      onBack();
    } else {
      setError("儲存失敗");
    }
  };

  const handleSignatureComplete = async (signatureData) => {
    // 先進入發送狀態 (顯示Loader)
    setStep("sending");
    setIsEmailSending(true);

    const docId = isSigningPending ? initialData.id : null;
    // 傳入 staff
    const success = await onProcessTransaction(
      parseInt(amount),
      item,
      signatureData,
      type,
      docId,
      selectedStaff
    );

    setIsEmailSending(false);
    if (success) {
      setStep("success");
    } else {
      setError("交易失敗");
      setStep("input");
    }
  };

  const applyDepositPlan = (plan) => {
    const totalAmount = plan.base + plan.bonus;
    setAmount(totalAmount.toString());
    setItem(`${plan.name}儲值 (本金$${plan.base} + 回饋$${plan.bonus})`);
  };

  const ThemeIcon = type === "expense" ? MinusCircle : PlusCircle;

  if (step === "confirm") {
    return (
      <SignaturePad
        amount={amount}
        item={item}
        user={targetUser}
        type={type}
        onConfirm={handleSignatureComplete}
        onCancel={() => setStep("input")}
      />
    );
  }

  // 新增：發送中的狀態畫面
  if (step === "sending") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          正在處理交易...
        </h2>
        {targetUser.email && (
          <p className="text-sm text-slate-500">
            同時發送消費清單至 {targetUser.email}
          </p>
        )}
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center pt-20">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-bounce ${
            type === "expense" ? "bg-orange-100" : "bg-green-100"
          }`}
        >
          <CheckCircle
            className={`w-10 h-10 ${
              type === "expense" ? "text-orange-600" : "text-green-600"
            }`}
          />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {type === "expense" ? "扣款成功" : "儲值成功"}
        </h2>
        <div className="bg-slate-50 w-full p-4 rounded-lg border border-slate-200 mb-6">
          <div className="flex justify-between text-lg font-bold text-slate-800">
            <span>金額</span>
            <span
              className={
                type === "expense" ? "text-orange-600" : "text-green-600"
              }
            >
              {type === "expense" ? "-" : "+"}
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        {/* Email 發送成功提示 */}
        {targetUser.email && (
          <div className="mb-8 w-full bg-blue-50 border border-blue-100 p-3 rounded-lg flex flex-col items-center gap-1 animate-fade-in">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold text-sm">
              <Mail className="w-4 h-4" />
              <span>此次消費清單已發送</span>
            </div>
            <p className="text-blue-500 text-xs">{targetUser.email}</p>
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-slate-700 transition"
        >
          返回操作面板
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="text-slate-500 mb-4 flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />{" "}
        {isSigningPending ? "取消簽核" : "取消交易"}
      </button>

      <div
        className={`border-l-4 p-4 rounded-r-lg mb-6 shadow-sm bg-white ${
          type === "expense" ? "border-orange-500" : "border-green-500"
        }`}
      >
        <h3
          className={`font-bold text-lg ${
            type === "expense" ? "text-orange-600" : "text-green-600"
          } flex items-center gap-2`}
        >
          {type === "expense" ? (
            <MinusCircle className="w-5 h-5" />
          ) : (
            <PlusCircle className="w-5 h-5" />
          )}
          {isSigningPending
            ? type === "expense"
              ? "補簽消費扣款"
              : "補簽餘額儲值"
            : type === "expense"
            ? "新增消費扣款"
            : "新增餘額儲值"}
        </h3>
      </div>

      {type === "deposit" && !isSigningPending && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {DEPOSIT_PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => applyDepositPlan(plan)}
              className={`bg-gradient-to-br ${plan.bgGradient} ${plan.textColor} rounded-lg p-2 shadow-md active:scale-95 transition-transform flex flex-col items-center text-center relative overflow-hidden border border-white/20`}
            >
              <div
                className={`absolute -right-2 -top-2 w-8 h-8 bg-white/20 rounded-full blur-md`}
              ></div>
              <Award className={`w-5 h-5 mb-1 ${plan.iconColor}`} />
              <span className="text-xs font-bold block mb-0.5">
                {plan.name}
              </span>
              <span className="text-[10px] opacity-90">送 ${plan.bonus}</span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {type === "expense" ? "消費項目" : "儲值備註"}
          </label>
          <input
            type="text"
            placeholder={
              type === "expense" ? "例如：黑白列印 A4" : "例如：現金儲值"
            }
            value={item}
            onChange={(e) => setItem(e.target.value)}
            disabled={isSigningPending}
            className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-colors ${
              isSigningPending ? "bg-slate-100 text-slate-500" : ""
            } ${
              type === "expense"
                ? "focus:ring-orange-500 border-slate-300"
                : "focus:ring-green-500 border-slate-300"
            }`}
          />
          {!isSigningPending && type === "expense" && (
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_ITEMS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setItem(tag)}
                  className="text-xs bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-700 px-2 py-1 rounded border border-slate-200 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          {!isSigningPending && type === "deposit" && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setItem("現金儲值")}
                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200"
              >
                現金儲值
              </button>
              <button
                onClick={() => setItem("匯款儲值")}
                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200"
              >
                匯款儲值
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {type === "expense" ? "扣款金額" : "儲值總額 (含回饋)"}
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSigningPending}
              className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 outline-none font-mono text-lg ${
                isSigningPending ? "bg-slate-100 text-slate-500" : ""
              } ${
                type === "expense"
                  ? "focus:ring-orange-500 border-slate-300"
                  : "focus:ring-green-500 border-slate-300"
              }`}
            />
          </div>
          {!isSigningPending && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`text-xs px-3 py-1.5 rounded-full font-mono font-bold whitespace-nowrap border transition ${
                    type === "expense"
                      ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                      : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 經手人員選擇 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <UserCheck className="w-4 h-4 text-slate-500" /> 經手人員{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {STAFF_MEMBERS.map((staff) => (
              <button
                key={staff}
                onClick={() => setSelectedStaff(staff)}
                className={`py-2 rounded border text-xs font-bold transition ${
                  selectedStaff === staff
                    ? type === "expense"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-green-600 text-white border-green-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {staff}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded flex items-center gap-2">
            <XCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {!isSigningPending ? (
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => handleCreateOrder(true)}
              className="py-3 rounded-lg font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 transition flex flex-col items-center justify-center gap-1"
            >
              <Save className="w-5 h-5" />
              <span className="text-xs">建立待簽單 (客戶未到)</span>
            </button>
            <button
              onClick={() => handleCreateOrder(false)}
              className={`py-3 rounded-lg font-bold text-white shadow-lg transition flex flex-col items-center justify-center gap-1 ${
                type === "expense"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <PenTool className="w-5 h-5" />
              <span className="text-xs">下一步：現場簽核</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleCreateOrder(false)}
            className={`w-full mt-6 py-4 rounded-lg font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
              type === "expense"
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <PenTool className="w-5 h-5" />
            開始簽名確認
          </button>
        )}
      </div>
    </div>
  );
}

// --- 簽名板 (維持不變) ---
function SignaturePad({ amount, item, user, type, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";
    const preventScroll = (e) => {
      if (e.target === canvas) e.preventDefault();
    };
    document.body.addEventListener("touchmove", preventScroll, {
      passive: false,
    });
    return () => document.body.removeEventListener("touchmove", preventScroll);
  }, []);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };
  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };
  const handleConfirm = () => {
    if (!hasSigned) {
      alert("請先簽名");
      return;
    }
    onConfirm(canvasRef.current.toDataURL());
  };

  const isExpense = type === "expense";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800">請確認訂單並簽名</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-end mb-2">
            <span className="text-slate-500 text-sm">會員姓名</span>
            <span className="font-bold text-slate-800">{user.name}</span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-slate-500 text-sm">
              {isExpense ? "消費項目" : "儲值備註"}
            </span>
            <span className="font-bold text-slate-800">{item}</span>
          </div>
          <div className="flex justify-between items-end mb-6 pt-2 border-t border-dashed border-slate-300">
            <span className="text-slate-800 font-bold">
              {isExpense ? "扣款總額" : "儲值總額"}
            </span>
            <span
              className={`text-2xl font-bold ${
                isExpense ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(amount)}
            </span>
          </div>
          <div className="mb-2 text-sm text-slate-500 font-medium">
            請在下方區域簽名確認：
          </div>
          <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 relative touch-none">
            <canvas
              ref={canvasRef}
              width={340}
              height={180}
              className="w-full h-48 cursor-crosshair rounded-lg"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <button
              onClick={clearSignature}
              className="absolute top-2 right-2 text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 hover:text-red-500"
            >
              重簽
            </button>
          </div>
          {!hasSigned && (
            <p className="text-red-400 text-xs mt-1 text-right">
              * 必須簽名才能送出
            </p>
          )}
        </div>
        <div className="p-4 border-t bg-slate-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-slate-100"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasSigned}
            className={`flex-1 py-3 rounded-lg text-white font-bold shadow-md flex justify-center items-center gap-2 ${
              hasSigned
                ? isExpense
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            <CheckCircle className="w-5 h-5" />{" "}
            {isExpense ? "確認扣款" : "確認儲值"}
          </button>
        </div>
      </div>
    </div>
  );
}
