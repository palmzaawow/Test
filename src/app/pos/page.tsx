"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollapse } from "@/app/CollapseContext";
import clsx from "clsx";

import { BrowserMultiFormatReader } from "@zxing/library";

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // เรียกครั้งแรกเพื่ออัปเดตค่า

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

export default function POS() {
  const router = useRouter();
  const pathname = usePathname(); // รับค่าของ path ปัจจุบัน
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { isCollapsed, toggleCollapse } = useCollapse(); // สถานะสำหรับจัดการการย่อ/ขยาย nav

  const [searchQuery, setSearchQuery] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [currentDateTime, setCurrentDateTime] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const finalPrice = totalPrice - discountAmount;

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const { width, height } = useWindowSize();

  const videoRef = useRef<HTMLVideoElement>(null); // Reference for the video element
  // const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false); // Control popup visibility
  const [cameraPermission, setCameraPermission] = useState(false);

  const handleScan = (decodedText: string) => {
    // setScannedCode(decodedText); // Store the scanned result in state
    setSearchQuery(decodedText);

    setShowScanner(false);

    setMessage(`${decodedText} ถูกเพิ่มลงตะกร้าแล้ว !!!`);
    setTimeout(() => setMessage(null), 2000);
  };

  // Handle errors during scanning
  const handleError = (errorMessage: string) => {
    console.error("Error scanning barcode:", errorMessage);
  };

  // Close the scanner popup
  const handleClose = () => {
    setShowScanner(false); // Close the popup when clicking 'X'
  };

  // Request camera permission to scan barcodes
  const openScanner = async () => {
    try {
      // Request access to the camera
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true); // If permission is granted
      setShowScanner(true); // Show the scanner
    } catch (err) {
      setCameraPermission(false); // If permission is denied
      alert(`Please enable camera access to scan barcodes. Error: ${err}`);
    }
  };

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader(); // ZXing barcode reader instance

    const startScanner = async () => {
      if (showScanner && cameraPermission && videoRef.current) {
        try {
          // List all video input devices (cameras)
          const devices = await codeReader.listVideoInputDevices();
          const videoDevice =
            devices.find((device) =>
              device.label.toLowerCase().includes("back")
            )?.deviceId || devices[0]?.deviceId; // Fall back to the first device if no rear camera is found

          if (videoDevice) {
            // Start decoding from the selected video input
            codeReader.decodeFromVideoDevice(
              videoDevice,
              videoRef.current,
              (result, error) => {
                if (result) {
                  handleScan(result.getText()); // Pass the decoded text to the handleScan function
                }

                if (error) {
                  handleError(error.message);
                }
              }
            );
          }
        } catch (err) {
          console.error("Error starting the scanner:", err);
        }
      }
    };

    startScanner();

    // Cleanup function to stop the scanner when the component is unmounted
    return () => {
      codeReader.reset(); // Stop the scanner and release resources
    };
  }, [showScanner, cameraPermission]);

  const applyDiscount = () => {
    if (discountCode === "SALE50") {
      setDiscountAmount(totalPrice * 0.5); // ลด 50%
    } else if (discountCode === "SALE10") {
      setDiscountAmount(totalPrice * 0.1); // ลด 10%
    } else {
      alert("❌ โค้ดส่วนลดไม่ถูกต้อง");
      setDiscountAmount(0);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    setMessage(`${product.name} ถูกเพิ่มลงตะกร้าแล้ว !!!`);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleSell = () => {
    if (cart.length === 0) {
      alert("❌ ตะกร้าว่างเปล่า ไม่สามารถขายสินค้าได้");
      return;
    }

    setIsPopupOpen(true);
  };

  const confirmPayment = (method: string) => {
    // setPaymentMethod(method);
    alert(
      `✅ ขายสินค้าเรียบร้อยแล้ว! \nชำระโดย: ${method} \nรวมเป็นเงิน ${finalPrice.toLocaleString()} บาท`
    );

    // รีเซ็ตค่าหลังจากขายสินค้า
    setCart([]);
    setDiscountCode("");
    setDiscountAmount(0);

    setIsPopupOpen(false);
  };

  const handleChangeProduct = () => {
    alert("🔄 โปรดเลือกสินค้าที่ต้องการเปลี่ยน");
    // ตรงนี้สามารถเพิ่มฟังก์ชันเพื่อเปิด Modal หรือหน้าเลือกสินค้าได้
  };

  const updateQuantity = (productId: number, change: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const categories = [
    { id: 1, name: "สินค้าทั้งหมด" },
    { id: 2, name: "น้ำมันเครื่อง" },
    { id: 3, name: "ปุ๋ยเคมี" },
    { id: 4, name: "ยาฆ่าแมลง" },
    { id: 5, name: "อะไหล่รถยนต์" },
  ];

  type CartItem = Product & { quantity: number };

  type Product = {
    id: number;
    name: string;
    price: number;
    image: string;
    productCode: string;
    quantity: number;
  };

  const products: Product[] = [
    {
      id: 1,
      name: "น้ำมันเครื่อง X",
      price: 500,
      image: "/pic/data.jpg",
      productCode: "OIL-X01",
      quantity: 20,
    },
    {
      id: 2,
      name: "ปุ๋ยเคมี Y",
      price: 150,
      image: "/pic/data.jpg",
      productCode: "FERT-Y02",
      quantity: 50,
    },
    {
      id: 3,
      name: "ยาฆ่าแมลง Z",
      price: 300,
      image: "/pic/data.jpg",
      productCode: "PEST-Z03",
      quantity: 30,
    },
    {
      id: 4,
      name: "น้ำมันเครื่อง A",
      price: 520,
      image: "/pic/data.jpg",
      productCode: "OIL-A04",
      quantity: 15,
    },
    {
      id: 5,
      name: "ปุ๋ยเคมี B",
      price: 180,
      image: "/pic/data.jpg",
      productCode: "FERT-B05",
      quantity: 40,
    },
    {
      id: 6,
      name: "ยาฆ่าแมลง C",
      price: 250,
      image: "/pic/data.jpg",
      productCode: "PEST-C06",
      quantity: 25,
    },
    {
      id: 7,
      name: "อะไหล่รถยนต์ D",
      price: 100,
      image: "/pic/data.jpg",
      productCode: "PART-D07",
      quantity: 60,
    },
    {
      id: 8,
      name: "น้ำมันเครื่อง E",
      price: 600,
      image: "/pic/data.jpg",
      productCode: "OIL-E08",
      quantity: 18,
    },
    {
      id: 9,
      name: "ปุ๋ยเคมี F",
      price: 200,
      image: "/pic/data.jpg",
      productCode: "FERT-F09",
      quantity: 35,
    },
    {
      id: 10,
      name: "ยาฆ่าแมลง G",
      price: 350,
      image: "/pic/data.jpg",
      productCode: "PEST-G10",
      quantity: 22,
    },
    {
      id: 11,
      name: "อะไหล่รถยนต์ H",
      price: 120,
      image: "/pic/data.jpg",
      productCode: "PART-H11",
      quantity: 55,
    },
    {
      id: 12,
      name: "น้ำมันเครื่อง I",
      price: 550,
      image: "/pic/data.jpg",
      productCode: "OIL-I12",
      quantity: 17,
    },
    {
      id: 13,
      name: "ปุ๋ยเคมี J",
      price: 160,
      image: "/pic/data.jpg",
      productCode: "FERT-J13",
      quantity: 45,
    },
    {
      id: 14,
      name: "ยาฆ่าแมลง K",
      price: 280,
      image: "/pic/data.jpg",
      productCode: "PEST-K14",
      quantity: 28,
    },
    {
      id: 15,
      name: "อะไหล่รถยนต์ L",
      price: 90,
      image: "/pic/data.jpg",
      productCode: "PART-L15",
      quantity: 65,
    },
    {
      id: 16,
      name: "น้ำมันเครื่อง M",
      price: 630,
      image: "/pic/data.jpg",
      productCode: "OIL-M16",
      quantity: 14,
    },
    {
      id: 17,
      name: "ปุ๋ยเคมี N",
      price: 140,
      image: "/pic/data.jpg",
      productCode: "FERT-N17",
      quantity: 48,
    },
    {
      id: 18,
      name: "ยาฆ่าแมลง O",
      price: 330,
      image: "/pic/data.jpg",
      productCode: "PEST-O18",
      quantity: 27,
    },
    {
      id: 19,
      name: "อะไหล่รถยนต์ P",
      price: 110,
      image: "/pic/data.jpg",
      productCode: "PART-P19",
      quantity: 58,
    },
    {
      id: 20,
      name: "น้ำมันเครื่อง Q",
      price: 580,
      image: "/pic/data.jpg",
      productCode: "OIL-Q20",
      quantity: 16,
    },
  ];

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateString = now.toLocaleString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentDateTime(dateString);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000); // อัปเดตเวลาในทุก ๆ 1 วินาที

    return () => clearInterval(interval); // ทำความสะอาดเมื่อคอมโพเนนต์ถูกทำลาย
  }, []);

  useEffect(() => {
    // ตั้งค่า default ให้เป็นหมวดหมู่แรกในกรณีที่ยังไม่มีการเลือก
    if (categories.length > 0 && selectedCategory === null) {
      setSelectedCategory(categories[0].id); // ตั้งค่าให้เลือกหมวดหมู่แรก
    }
  }, [categories, selectedCategory]);

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setIsDropdownOpen(false); // Close the dropdown after selection
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return; // ถ้าไม่มีข้อความ ไม่ต้องค้นหา

    // ค้นหาข้อมูลในฐานข้อมูล (คุณต้องไปเชื่อม API หรือฐานข้อมูลของคุณ)
  };

  const handleSearchWithValidation = () => {
    if (!searchQuery.trim()) {
      return; // ถ้าไม่มีข้อความ ไม่ต้องค้นหา
    }
    alert("จ้าค้นหาจ้า");
    handleSearch();
  };

  const handelclearcart = () => {
    setCart([]); // เอาไว้เคลียบิลที่ขายของ
  };

  const navItems = [
    { name: "Overview", icon: "/icons/overviewicon.svg" },
    { name: "POS", icon: "/icons/posicon.svg" },
    { name: "Inventory", icon: "/icons/inventoryicon.svg" },
    { name: "Suppliers", icon: "/icons/suppliersicon.svg" },
    { name: "Accounting", icon: "/icons/accountingicon.svg" },
    { name: "Logistics", icon: "/icons/logisticsicon.svg" },
    { name: "Settings", icon: "/icons/settingsicon.svg" },
  ];

  const handleLogout = () => {
    router.push("/login");
  };

  // ป้องกันการรีเรนเดอร์ซ้ำในครั้งแรก
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <div className="fixed top-6 z-30 right-4 bg-[#FFFFFF] shadow-lg hover:bg-[#E0E0E0] rounded-full px-4 p-3 w-auto h-[50px] flex items-center gap-2">
        <Image
          src="/palm.jpg" // pic profile
          alt="Profile"
          width={45}
          height={45}
          className="rounded-full border-2 border-gray-300"
        />
        <div className="text-sm font-[InterVariable] text-gray-800">
          Palm Krisakorn {/* เปลี่ยนเป็นชื่อผู้ใช้ */}
        </div>
      </div>

      {/* ตะกร้า*/}

      <div className="flex flex-col right-4 gap-3 z-30">
        <div className="scrollable-container fixed flex-wrap right-4 mt-[90px] max-h-[380px] w-[380px] sm:w-[320px] rounded-lg bg-white shadow-lg p-4 overflow-y-auto border-l border-gray-300">
          <div className="flex justify-between gap-10">
            <h2 className="text-xl text-gray-500 font-bold font-[IBMPlexSansThai-Light] mb-4">
              หมายเลขบิล :
            </h2>

            <button
              onClick={handelclearcart}
              className="p-1 h-8 bg-[#fff] text-red-500 rounded-lg "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 6h18v2H3V6zm2 2h14v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8zm2 2v11h10V10H7zm2 0h6v9H9v-9zm1-6h4v2h-4V4z" />
              </svg>
            </button>
          </div>
          <h2 className="text-lg text-gray-500 font-bold font-[IBMPlexSansThai-Light] mb-4">
            🛒 ตะกร้าสินค้า ({totalQuantity})
          </h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 font-bold font-[IBMPlexSansThai-Light] text-center">
              ยังไม่มีสินค้า
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-100 p-4 rounded-lg h-[70px] shadow-md flex justify-between items-center"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="object-cover rounded-md"
                  />
                  <div className="flex-1 ml-2">
                    <h3 className="text-sm text-gray-600 font-bold  font-[IBMPlexSansThai-Light]">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-bold  font-[IBMPlexSansThai-Light]">
                      รหัส: {item.productCode}
                    </p>
                    <p className="text-xs text-gray-600 font-bold font-[IBMPlexSansThai-Light]">
                      {item.price} บาท
                    </p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="px-2 py-2 bg-gray-100 text-center font-[IBMPlexSansThai-Light] text-red-600 font-bold text-2xl rounded-lg"
                    >
                      -
                    </button>
                    <span className="mx-2 text-gray-600 font-[IBMPlexSansThai-Light] font-bold text-2xl">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="px-2 py-2 bg-gray-100 text-center font-[IBMPlexSansThai-Light] text-green-500 font-bold text-2xl rounded-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ส่วนกรอกโค้ดส่วนลดและสรุปราคา */}
        <div className="fixed right-4 bottom-4 w-[390px] sm:w-[320px] bg-white shadow-lg p-4 rounded-lg border-t border-gray-300">
          {/* <h3 className="text-lg font-bold text-gray-600">📌 ใช้โค้ดส่วนลด</h3> */}
          <div className="flex  mt-0">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="ใส่โค้ดส่วนลดที่นี่"
              className="flex-1 border font-bold font-[IBMPlexSansThai-Light] pl-2 py-1 text-black w-auto h-[25px] border-gray-300 rounded-lg "
            />
            <button
              onClick={applyDiscount}
              className="ml-2 bg-indigo-700 font-[IBMPlexSansThai-Light] text-white text-lg px-2 w-auto h-[25px] rounded-lg hover:bg-indigo-600 transition"
            >
              ใช้โค้ด
            </button>
          </div>

          <div className="mt-4 text-gray-700">
            {/*💰 🎉 🏷️*/}
            <p className="text-lg font-[IBMPlexSansThai-Light]">
              ราคารวม: {totalPrice.toLocaleString()} บาท {width}
            </p>
            <p className="text-lg font-[IBMPlexSansThai-Light] text-green-600">
              ส่วนลด: {discountAmount.toLocaleString()} บาท {height}
            </p>
            <p className="text-xl font-bold font-[IBMPlexSansThai-Light] text-indigo-600">
              ราคารวมสุทธิ: {finalPrice.toLocaleString()} บาท
            </p>
          </div>

          {/* ปุ่มเปลี่ยนสินค้า (ซ้าย) และขายสินค้า (ขวา) */}
          <div className="mt-4 flex justify-between">
            <button
              onClick={handleChangeProduct}
              className="w-[48%] bg-yellow-500 text-white text-xl font-[IBMPlexSansThai-Light] py-2 rounded-lg hover:bg-yellow-600 transition"
            >
              เปลี่ยนสินค้า
            </button>
            <button
              onClick={handleSell}
              className="w-[48%] bg-green-500 text-white text-xl font-[IBMPlexSansThai-Light] py-2 rounded-lg hover:bg-green-600 transition"
            >
              ขายสินค้า
            </button>
          </div>
        </div>
      </div>

      <div className="fixed z-30 top-6 right-[210px] bg-[#FFFFFF] shadow-lg hover:bg-[#E0E0E0] rounded-full px-4 p-3 w-auto h-[50px] flex items-center gap-2">
        <div className="text-sm font-[IBMPlexSansThai-Light] font-bold text-gray-800">
          {currentDateTime}
        </div>
      </div>

      <div className="fixed top-0 left-0 w-[120px] bg-white text-black p-0 z-10">
        <h1
          className="text-5xl mb-8 px-14 py-8 font-[BauhausRegular]"
          onClick={toggleCollapse}
        >
          Baan Nay
        </h1>
      </div>

      {/* left Nav Bar */}
      <nav
        className={`w-[${
          isCollapsed ? "80px" : "220px"
        }] bg-white mt-[208px] text-black p-0 hidden sm:flex z-30 flex-col gap-4 fixed h-full transition-all`}
      >
        {navItems.map(({ name, icon }, index) => {
          const isActive = pathname.startsWith(`/${name.toLowerCase()}`);
          return (
            <Link
              key={index}
              href={`/${name.toLowerCase()}`}
              className={`relative flex items-center gap-8 text-l px-6 py-2 w-50 h-12 font-[InterVariable] rounded transition 
                ${
                  isActive
                    ? "bg-[#E0E0E0] text-black pl-4"
                    : "hover:bg-[#E0E0E0] pl-2"
                } 
              `}
            >
              <div
                className={`absolute left-0 w-2 h-12 rounded-r-md transition-all 
                ${isActive ? "bg-blue-500" : "bg-transparent"}
              `}
              />
              <Image
                src={icon}
                alt={name}
                width={28}
                height={28}
                className={`${isActive ? "ml-4" : "ml-2"} transition-all`}
              />
              {!isCollapsed && (
                <span
                  className={`${isActive ? "ml-4" : "ml-2"} transition-all`}
                >
                  {name}
                </span>
              )}
            </Link>
          );
        })}

        {!isCollapsed && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-8 text-l px-6 py-2 w-[220px] h-12 font-[InterVariable] bg-[#FFFFF] rounded text-black hover:bg-[#F44336] transition fixed bottom-6 left-0"
          >
            <Image
              src="/icons/logouticon.svg"
              alt="Log Out"
              width={28}
              height={28}
            />
            Log Out
          </button>
        )}
      </nav>

      <div className="fixed colorbg ml-44 w-[650px] h-[315px] z-20"></div>

      <nav className="fixed colorbg ml-52 top-[70px] flex justify-start items-start gap-8 py-4 z-30">
        <Link
          href="/pos"
          className={clsx(
            "text-lg text-black font-[IBMPlexSansThai-Light] transition-all",
            pathname === "/pos"
              ? "font-bold border-b-2 border-[#000000]"
              : "font-normal"
          )}
        >
          หน้าขายสินค้า
        </Link>

        <Link
          href="/pos/sales-record"
          className={clsx(
            "text-lg text-black font-[IBMPlexSansThai-Light] transition-all",
            pathname === "/pos/sales-record"
              ? "font-bold border-b-2 border-[#000000]"
              : "font-normal"
          )}
        >
          บันทึกรายการขาย
        </Link>
      </nav>

      {/* Main Content */}
      <div
        className={clsx(
          "flex-1 flex flex-col items-start justify-start text-left mt-36 p-0 bg-[#FFFFFF] w-full",
          isCollapsed ? "sm:ml-[80px]" : "sm:ml-[120px]"
        )}
      >
        <div className="flex flex-col  items-start gap-4 ml-32 ">
          <div className="sticky colorbg top-36 mt-0 w-auto h-auto z-20">
            <h1 className="text-3xl mt-4 text-black font-[IBMPlexSansThai-Light] sm:text-2xl font-bold">
              ขายสินค้า
            </h1>

            <div className="flex items-center mt-2 border w-[520px] focus-within:border-indigo-500 transition duration-300 pr-3 gap-2 bg-white border-gray-500/30 h-[46px] rounded-[5px] overflow-hidden">
              <input
                type="text"
                placeholder="ค้นหาสินค้า (ค้นหาด้วยชื่อหรือหมายเลขสินค้า)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchWithValidation(); // เรียกใช้ handleSearchWithValidation เมื่อกด Enter
                  }
                }}
                className="w-full h-full pl-4 outline-none placeholder-gray-500 front-[IBMPlexSansThai-Light] text-black text-sm"
              />
              <button
                onClick={handleSearchWithValidation}
                className="text-gray-600 hover:text-black"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width={22}
                  height={22}
                  viewBox="0 0 30 30"
                  fill="#6B7280"
                >
                  <path d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z" />
                </svg>
              </button>

              <button
                onClick={openScanner}
                className="text-gray-600 hover:text-black"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="#6B7280"
                >
                  <path d="M4 4h3V2H2v5h2V4zm13-2v2h3v3h2V2h-5zM4 17H2v5h5v-2H4v-3zm17 3h-3v2h5v-5h-2v3zM5 11h2v2H5v-2zm3 0h1v2H8v-2zm2 0h2v2h-2v-2zm3 0h1v2h-1v-2zm2 0h2v2h-2v-2zm3 0h2v2h-2v-2z" />
                </svg>
              </button>
            </div>

            <div className="flex justify-between mt-6 gap-8 items-center py-0">
              {/* ส่วนที่ 1: <h1> อยู่ทางซ้าย */}
              <h1 className="text-xl text-black font-[IBMPlexSansThai-Light] sm:text-xl font-bold">
                เลือกสินค้า
              </h1>

              {/* ส่วนที่ 2: Dropdown อยู่ทางขวา */}
              <div className="relative z-20">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-white text-black w-auto h-[30px] p-4 border rounded-xl shadow-md text-left flex items-center justify-between "
                >
                  <span>
                    {selectedCategory
                      ? categories.find((cat) => cat.id === selectedCategory)
                          ?.name
                      : "เลือกหมวดหมู่สินค้า"}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="28"
                    height="28"
                    className={`transform ${
                      isDropdownOpen ? "rotate-180" : "rotate-0"
                    } transition-transform`}
                  >
                    <path d="M12 16l-4-4h8l-4 4z" />
                  </svg>
                </button>

                {/* Dropdown List */}
                {isDropdownOpen && (
                  <div className="mt-1 bg-white border rounded-lg shadow-md w-auto max-w-full absolute left-0 top-full">
                    <nav className="space-y-2 p-4">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="w-full p-2 cursor-pointer hover:bg-gray-100 rounded-lg"
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          <h2 className="text-center text-black text-md font-[IBMPlexSansThai-Light]">
                            {category.name}
                          </h2>
                        </div>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="scrollable-container flex-wrap p-2 w-[calc(100%)] gap-4 mt-4 max-h-auto">
            {/* ใส่ข้อมูลสินค้า */}
            <div className="grid md:grid-cols-3 gap-3 w-full">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="flex-none p-0 cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-300 ease-in-out transform rounded-lg"
                >
                  {/* การ์ดสินค้า */}
                  <div className="bg-white p-1 rounded-lg shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-300 border border-gray-200">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={100}
                      height={100}
                      className="object-cover w-full h-[140px] rounded-md"
                    />

                    {/* ชื่อสินค้า */}
                    <h3 className="mt-4 text-center text-black text-md font-semibold font-[IBMPlexSansThai-Light]">
                      {product.name}
                    </h3>

                    {/* โค้ดสินค้า */}
                    <p className="mt-1 text-center text-xs text-gray-400 font-medium font-[IBMPlexSansThai-Light]">
                      รหัสสินค้า: {product.productCode}
                    </p>

                    {/* ราคา */}
                    <p className="mt-2 text-center text-sm text-gray-500 font-bold font-[IBMPlexSansThai-Light]">
                      {product.price} บาท
                    </p>

                    {/* จำนวนสินค้า */}
                    <p className="mt-1 text-center text-sm text-gray-600 font-[IBMPlexSansThai-Light]">
                      คงเหลือ: {product.quantity} ชิ้น
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popups Content */}

      {/* ข้อความสินค้าเพิ่มในตะกร้า */}
      {message && (
        <div className="fixed top-[34px] z-30 left-[200px] bg-[#fff] text-gray-600  px-4 py-2 rounded-lg shadow-lg transition-opacity duration-500">
          {message}
        </div>
      )}

      {/*  Popup เลือกวิธีชำระเงิน */}
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-30">
          <div className="bg-white w-[300px] p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold text-gray-700 text-center">
              เลือกวิธีชำระเงิน
            </h2>
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={() => confirmPayment("💵 เงินสด")}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
              >
                เงินสด
              </button>
              <button
                onClick={() => confirmPayment("🏦 โอนเงิน")}
                className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition"
              >
                โอนเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup สำหรับสแกนบาร์โค้ด */}
      {showScanner && (
        <div className="popup-overlay z-30">
          <div className="popup-content">
            <button onClick={handleClose} className="close-btn">
              X
            </button>
            {/* Display the video element for camera feed */}
            <div
              id="reader"
              className="text-black"
              style={{ width: "100%", height: "400px", position: "relative" }}
            >
              <video
                ref={videoRef}
                id="reader-video"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  objectFit: "cover",
                }}
                autoPlay
                muted
              ></video>

              <div className="scan-box">
                <div className="center-line"></div> {/* เส้นกลาง */}
              </div>
            </div>
            {/* <h1 className="text-black">Scanned Code: {scannedCode}</h1> */}
          </div>
        </div>
      )}

      {/* ถ้ากล้องไม่ได้รับอนุญาตให้แสดงข้อความเตือน */}
      {cameraPermission === false && (
        <p className="text-red-500 fixed z-30 left-[720px]">
          Please enable camera access to scan barcodes.
        </p>
      )}
    </div>
  );
}
