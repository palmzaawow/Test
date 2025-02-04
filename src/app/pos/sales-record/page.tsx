"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollapse } from "@/app/CollapseContext";
import clsx from "clsx";

export default function Salesrecord() {
  const router = useRouter();
  const pathname = usePathname(); // รับค่าของ path ปัจจุบัน
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { isCollapsed, toggleCollapse } = useCollapse(); // สถานะสำหรับจัดการการย่อ/ขยาย nav

  const [currentDateTime, setCurrentDateTime] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

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
    // ลบข้อมูลจาก localStorage หรือ sessionStorage ตามที่คุณเก็บข้อมูลล็อกอิน
    //localStorage.removeItem('user'); // ตัวอย่างการลบข้อมูล

    // หรือถ้าคุณใช้ sessionStorage
    //sessionStorage.removeItem('user');

    router.push("/login");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return; // ถ้าไม่มีข้อความ ไม่ต้องค้นหา

    // // ค้นหาข้อมูลในฐานข้อมูล (คุณต้องไปเชื่อม API หรือฐานข้อมูลของคุณ)
    // try {
    //   const response = await fetch(`/api/search?query=${searchQuery}`);
    //   const data = await response.json();
    //   console.log("ผลลัพธ์การค้นหา:", data); // ลองดูผลลัพธ์ก่อน

    //   // ส่งผู้ใช้ไปที่หน้าผลลัพธ์ หรือจัดการแสดงผลในหน้านี้
    //   router.push(`/search-results?query=${searchQuery}`);
    // } catch (error) {
    //   console.error("เกิดข้อผิดพลาดในการค้นหา:", error);
    // }
  };

  // ป้องกันการรีเรนเดอร์ซ้ำในครั้งแรก
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    // จัดการการเปลี่ยนแปลงเส้นทางที่ไม่จำเป็น
  }, [pathname]);

  return (
    <div className="flex ">
      <div className="fixed top-6 right-4 bg-[#FFFFFF] shadow-lg hover:bg-[#E0E0E0] rounded-full px-4 p-3 w-auto h-[50px] flex items-center gap-2">
        {/* Profile Image */}
        <Image
          src="/palm.jpg" // pic profile
          alt="Profile"
          width={45}
          height={45}
          className="rounded-full border-2 border-gray-300"
        />
        {/* Username */}
        <div className="text-sm font-[InterVariable] text-gray-800">
          Palm Krisakorn {/* เปลี่ยนเป็นชื่อผู้ใช้ */}
        </div>
      </div>

      {/* กล่องแสดงเวลาและวันที่ */}
      <div className="fixed top-6 right-[200px] bg-[#FFFFFF] shadow-lg hover:bg-[#E0E0E0] rounded-full px-4 p-3 w-auto h-[50px] flex items-center gap-2">
        <div className="text-sm  font-[IBMPlexSansThai-Light] font-bold text-gray-800">
          {currentDateTime}
        </div>
      </div>

      <div className="fixed top-0 left-0 w-[120px] bg-white text-black p-0 z-10">
        <h1
          className="text-5xl mb-8 px-14 py-8 font-[BauhausRegular]"
          onClick={toggleCollapse} // Toggle collapse on click
        >
          Baan Nay
        </h1>
      </div>

      {/* left Nav Bar */}
      <nav
        className={`w-[${isCollapsed ? "80px" : "220px"}] bg-white mt-[208px] text-black p-0 hidden sm:flex flex-col gap-4 fixed h-full transition-all`}
      >
        {/* Render Nav Items */}
        {navItems.map(({ name, icon }, index) => {
          const isActive = pathname.startsWith(`/${name.toLowerCase()}`);
          return (
            <Link
              key={index}
              href={`/${name.toLowerCase()}`}
              className={`relative flex items-center gap-8 text-l px-6 py-2 w-50 h-12 font-[InterVariable] rounded transition 
                ${isActive ? "bg-[#E0E0E0] text-black pl-4" : "hover:bg-[#E0E0E0] pl-2"} 
              `}
            >
              {/* Indicator bar (แถบสีด้านซ้าย) */}
              <div
                className={`absolute left-0 w-2 h-12 rounded-r-md transition-all 
                ${isActive ? "bg-blue-500" : "bg-transparent"}
              `}
              />

              {/* เงื่อนไขการขยับไอคอนและชื่อเฉพาะเมื่อ active */}
              <Image
                src={icon}
                alt={name}
                width={28}
                height={28}
                className={`${isActive ? "ml-4" : "ml-2"} transition-all`}
              />
              {/* ถ้า nav ถูกย่อจะซ่อนชื่อ */}
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

        {/* ซ่อนปุ่ม Log Out เมื่อ Nav ย่อ */}
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

      {/* Navigation Bar */}
      <nav className="fixed ml-52 top-[70px] flex justify-start items-start gap-8 py-4 z-20">
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
          "flex-1 flex flex-col items-start justify-start text-left mt-36 p-0 bg-[#FFFFFF]  w-full",
          isCollapsed ? "sm:ml-[80px]" : "sm:ml-[120px]"
        )}
      >
        <div className="flex flex-col items-start gap-4 ml-32">
          {/* Title & Content */}
          <h1 className="text-3xl mt-4 text-black font-[IBMPlexSansThai-Light] sm:text-2xl font-bold">
            บันทึกรายการขาย
          </h1>

          {/* Search Bar */}
          <div className="flex items-center mt-2 border w-[520px] focus-within:border-indigo-500 transition duration-300 pr-3 gap-2 bg-white border-gray-500/30 h-[46px] rounded-[5px] overflow-hidden">
            <input
              type="text"
              placeholder="ค้นหาโดยหมายเลขบิล"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // อัพเดทค่าของ input
              className="w-full h-full pl-4 outline-none placeholder-gray-500 front-[IBMPlexSansThai-Light] text-black text-sm"
            />
            <button
              onClick={handleSearch}
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
          </div>

          <p className="text-lg text-black sm:text-xl mt-4">
            This is the main content area.
          </p>
        </div>
      </div>
    </div>
  );
}
