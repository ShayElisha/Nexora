import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SideBar from "../../pages/AdminPanel/layouts/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FaGlobe, FaRocket } from "react-icons/fa";
import { GrUpdate } from "react-icons/gr";
import Flag from "react-world-flags";
import DesignBox from "./DesignBox";
import { motion } from "framer-motion";
import PricingPlans from "../../pages/payment/PricingPlans";
import axiosInstance from "../../lib/axios";

const AnimatedShapes = () => {
  const shapes = [
    // 30 עיגולים (60px-250px)
    {
      type: "circle",
      size: { width: "60px", height: "60px" },
      bg: "var(--color-primary)",
      pos: { top: "5%", left: "5%" },
      animate: { x: [-200, 300, -150], y: [-100, 200, -100], rotate: [0, 360] },
      duration: 15,
    },
    {
      type: "circle",
      size: { width: "250px", height: "250px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "10%", right: "8%" },
      animate: { x: [150, -250, 150], y: [100, -200, 100], scale: [1, 1.2, 1] },
      duration: 18,
    },
    {
      type: "circle",
      size: { width: "150px", height: "150px" },
      bg: "var(--color-accent)",
      pos: { top: "60%", left: "85%" },
      animate: { x: [-180, 220, -180], y: [-120, 180, -120], rotate: [0, 180] },
      duration: 13,
    },
    {
      type: "circle",
      size: { width: "200px", height: "200px" },
      bg: "var(--color-primary)",
      pos: { top: "20%", right: "15%" },
      animate: { x: [200, -300, 200], y: [150, -150, 150] },
      duration: 16,
    },
    {
      type: "circle",
      size: { width: "80px", height: "80px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "25%", left: "10%" },
      animate: {
        x: [-250, 350, -250],
        y: [-130, 220, -130],
        scale: [1, 1.1, 1],
      },
      duration: 14,
    },
    {
      type: "circle",
      size: { width: "180px", height: "180px" },
      bg: "var(--color-accent)",
      pos: { top: "40%", left: "70%" },
      animate: { x: [180, -280, 180], y: [110, -190, 110], rotate: [0, 360] },
      duration: 17,
    },
    {
      type: "circle",
      size: { width: "120px", height: "120px" },
      bg: "var(--color-primary)",
      pos: { bottom: "15%", right: "25%" },
      animate: { x: [-220, 300, -220], y: [-100, 200, -100] },
      duration: 12,
    },
    {
      type: "circle",
      size: { width: "70px", height: "70px" },
      bg: "var(--color-secondary)",
      pos: { top: "70%", left: "20%" },
      animate: { x: [150, -250, 150], y: [80, -170, 80] },
      duration: 10,
    },
    {
      type: "circle",
      size: { width: "230px", height: "230px" },
      bg: "var(--color-accent)",
      pos: { top: "15%", left: "50%" },
      animate: { x: [-200, 320, -200], y: [-140, 230, -140], rotate: [0, 180] },
      duration: 19,
    },
    {
      type: "circle",
      size: { width: "160px", height: "160px" },
      bg: "var(--color-primary)",
      pos: { bottom: "30%", right: "5%" },
      animate: { x: [170, -270, 170], y: [120, -180, 120] },
      duration: 15,
    },
    {
      type: "circle",
      size: { width: "100px", height: "100px" },
      bg: "var(--color-secondary)",
      pos: { top: "50%", left: "30%" },
      animate: { x: [-190, 290, -190], y: [-110, 210, -110] },
      duration: 13,
    },
    {
      type: "circle",
      size: { width: "190px", height: "190px" },
      bg: "var(--color-accent)",
      pos: { bottom: "5%", left: "60%" },
      animate: { x: [200, -300, 200], y: [130, -200, 130], scale: [1, 1.1, 1] },
      duration: 16,
    },
    {
      type: "circle",
      size: { width: "90px", height: "90px" },
      bg: "var(--color-primary)",
      pos: { top: "25%", right: "30%" },
      animate: { x: [-230, 310, -230], y: [-120, 190, -120], rotate: [0, 270] },
      duration: 11,
    },
    {
      type: "circle",
      size: { width: "240px", height: "240px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "40%", left: "40%" },
      animate: { x: [180, -280, 180], y: [140, -210, 140] },
      duration: 20,
    },
    {
      type: "circle",
      size: { width: "140px", height: "140px" },
      bg: "var(--color-accent)",
      pos: { top: "80%", right: "20%" },
      animate: {
        x: [-210, 330, -210],
        y: [-150, 240, -150],
        scale: [1, 1.15, 1],
      },
      duration: 14,
    },
    {
      type: "circle",
      size: { width: "65px", height: "65px" },
      bg: "var(--color-primary)",
      pos: { top: "10%", left: "75%" },
      animate: { x: [160, -260, 160], y: [90, -180, 90] },
      duration: 12,
    },
    {
      type: "circle",
      size: { width: "170px", height: "170px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "20%", right: "35%" },
      animate: { x: [-240, 340, -240], y: [-130, 220, -130] },
      duration: 17,
    },
    {
      type: "circle",
      size: { width: "210px", height: "210px" },
      bg: "var(--color-accent)",
      pos: { top: "35%", left: "15%" },
      animate: { x: [190, -290, 190], y: [110, -200, 110], rotate: [0, 180] },
      duration: 18,
    },
    {
      type: "circle",
      size: { width: "110px", height: "110px" },
      bg: "var(--color-primary)",
      pos: { bottom: "50%", left: "80%" },
      animate: { x: [-200, 300, -200], y: [-100, 190, -100] },
      duration: 13,
    },
    {
      type: "circle",
      size: { width: "185px", height: "185px" },
      bg: "var(--color-secondary)",
      pos: { top: "45%", right: "10%" },
      animate: { x: [170, -270, 170], y: [120, -180, 120] },
      duration: 15,
    },
    {
      type: "circle",
      size: { width: "130px", height: "130px" },
      bg: "var(--color-accent)",
      pos: { bottom: "35%", left: "25%" },
      animate: {
        x: [-220, 320, -220],
        y: [-140, 230, -140],
        scale: [1, 1.1, 1],
      },
      duration: 14,
    },
    {
      type: "circle",
      size: { width: "75px", height: "75px" },
      bg: "var(--color-primary)",
      pos: { top: "65%", left: "55%" },
      animate: { x: [150, -250, 150], y: [80, -170, 80], rotate: [0, 360] },
      duration: 10,
    },
    {
      type: "circle",
      size: { width: "245px", height: "245px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "15%", right: "45%" },
      animate: { x: [-230, 310, -230], y: [-150, 240, -150] },
      duration: 19,
    },
    {
      type: "circle",
      size: { width: "115px", height: "115px" },
      bg: "var(--color-accent)",
      pos: { top: "75%", left: "40%" },
      animate: { x: [180, -280, 180], y: [100, -190, 100] },
      duration: 12,
    },
    {
      type: "circle",
      size: { width: "195px", height: "195px" },
      bg: "var(--color-primary)",
      pos: { bottom: "5%", left: "20%" },
      animate: { x: [-200, 300, -200], y: [-120, 210, -120] },
      duration: 16,
    },
    {
      type: "circle",
      size: { width: "85px", height: "85px" },
      bg: "var(--color-secondary)",
      pos: { top: "30%", right: "60%" },
      animate: { x: [160, -260, 160], y: [90, -180, 90], rotate: [0, 180] },
      duration: 11,
    },
    {
      type: "circle",
      size: { width: "225px", height: "225px" },
      bg: "var(--color-accent)",
      pos: { bottom: "45%", left: "65%" },
      animate: { x: [-240, 340, -240], y: [-130, 220, -130] },
      duration: 18,
    },
    {
      type: "circle",
      size: { width: "145px", height: "145px" },
      bg: "var(--color-primary)",
      pos: { top: "55%", right: "15%" },
      animate: { x: [190, -290, 190], y: [110, -200, 110] },
      duration: 14,
    },
    {
      type: "circle",
      size: { width: "175px", height: "175px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "25%", left: "50%" },
      animate: {
        x: [-210, 330, -210],
        y: [-140, 230, -140],
        scale: [1, 1.15, 1],
      },
      duration: 17,
    },
    {
      type: "circle",
      size: { width: "95px", height: "95px" },
      bg: "var(--color-accent)",
      pos: { top: "85%", right: "30%" },
      animate: { x: [150, -250, 150], y: [80, -170, 80], rotate: [0, 360] },
      duration: 10,
    },

    // 30 משולשים (60px-250px)
    {
      type: "triangle",
      size: { width: "60px", height: "60px" },
      bg: "var(--color-primary)",
      pos: { top: "8%", left: "12%" },
      animate: { x: [-150, 250, -150], y: [-80, 200, -80], rotate: [0, 270] },
      duration: 14,
    },
    {
      type: "triangle",
      size: { width: "250px", height: "250px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "12%", right: "15%" },
      animate: { x: [180, -280, 180], y: [120, -180, 120], scale: [1, 1.3, 1] },
      duration: 17,
    },
    {
      type: "triangle",
      size: { width: "150px", height: "150px" },
      bg: "var(--color-accent)",
      pos: { top: "55%", left: "80%" },
      animate: { x: [-200, 300, -200], y: [-100, 210, -100], rotate: [0, 90] },
      duration: 12,
    },
    {
      type: "triangle",
      size: { width: "200px", height: "200px" },
      bg: "var(--color-primary)",
      pos: { top: "25%", right: "20%" },
      animate: { x: [170, -270, 170], y: [110, -190, 110] },
      duration: 15,
    },
    {
      type: "triangle",
      size: { width: "80px", height: "80px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "30%", left: "15%" },
      animate: {
        x: [-230, 310, -230],
        y: [-120, 220, -120],
        scale: [1, 1.2, 1],
      },
      duration: 13,
    },
    {
      type: "triangle",
      size: { width: "180px", height: "180px" },
      bg: "var(--color-accent)",
      pos: { top: "45%", left: "65%" },
      animate: { x: [190, -290, 190], y: [130, -200, 130], rotate: [0, 360] },
      duration: 16,
    },
    {
      type: "triangle",
      size: { width: "120px", height: "120px" },
      bg: "var(--color-primary)",
      pos: { bottom: "20%", right: "30%" },
      animate: { x: [-210, 330, -210], y: [-110, 230, -110] },
      duration: 14,
    },
    {
      type: "triangle",
      size: { width: "70px", height: "70px" },
      bg: "var(--color-secondary)",
      pos: { top: "65%", left: "25%" },
      animate: { x: [150, -250, 150], y: [80, -170, 80] },
      duration: 10,
    },
    {
      type: "triangle",
      size: { width: "230px", height: "230px" },
      bg: "var(--color-accent)",
      pos: { top: "18%", left: "55%" },
      animate: { x: [-240, 340, -240], y: [-140, 240, -140], rotate: [0, 180] },
      duration: 18,
    },
    {
      type: "triangle",
      size: { width: "160px", height: "160px" },
      bg: "var(--color-primary)",
      pos: { bottom: "35%", right: "10%" },
      animate: { x: [180, -280, 180], y: [120, -190, 120] },
      duration: 15,
    },
    {
      type: "triangle",
      size: { width: "100px", height: "100px" },
      bg: "var(--color-secondary)",
      pos: { top: "48%", left: "35%" },
      animate: { x: [-200, 300, -200], y: [-100, 210, -100] },
      duration: 13,
    },
    {
      type: "triangle",
      size: { width: "190px", height: "190px" },
      bg: "var(--color-accent)",
      pos: { bottom: "8%", left: "55%" },
      animate: { x: [170, -270, 170], y: [110, -180, 110], scale: [1, 1.1, 1] },
      duration: 16,
    },
    {
      type: "triangle",
      size: { width: "90px", height: "90px" },
      bg: "var(--color-primary)",
      pos: { top: "30%", right: "35%" },
      animate: { x: [-230, 310, -230], y: [-120, 220, -120], rotate: [0, 270] },
      duration: 11,
    },
    {
      type: "triangle",
      size: { width: "240px", height: "240px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "45%", left: "45%" },
      animate: { x: [190, -290, 190], y: [130, -200, 130] },
      duration: 19,
    },
    {
      type: "triangle",
      size: { width: "140px", height: "140px" },
      bg: "var(--color-accent)",
      pos: { top: "75%", right: "25%" },
      animate: {
        x: [-210, 330, -210],
        y: [-140, 230, -140],
        scale: [1, 1.15, 1],
      },
      duration: 17,
    },
    {
      type: "triangle",
      size: { width: "65px", height: "65px" },
      bg: "var(--color-primary)",
      pos: { top: "15%", left: "70%" },
      animate: { x: [150, -250, 150], y: [80, -170, 80] },
      duration: 12,
    },
    {
      type: "triangle",
      size: { width: "170px", height: "170px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "25%", right: "40%" },
      animate: { x: [-240, 340, -240], y: [-130, 220, -130] },
      duration: 18,
    },
    {
      type: "triangle",
      size: { width: "210px", height: "210px" },
      bg: "var(--color-accent)",
      pos: { top: "40%", left: "20%" },
      animate: { x: [180, -280, 180], y: [110, -190, 110], rotate: [0, 180] },
      duration: 16,
    },
    {
      type: "triangle",
      size: { width: "110px", height: "110px" },
      bg: "var(--color-primary)",
      pos: { bottom: "55%", left: "75%" },
      animate: { x: [-200, 300, -200], y: [-100, 210, -100] },
      duration: 13,
    },
    {
      type: "triangle",
      size: { width: "185px", height: "185px" },
      bg: "var(--color-secondary)",
      pos: { top: "50%", right: "15%" },
      animate: { x: [170, -270, 170], y: [120, -180, 120] },
      duration: 15,
    },
    {
      type: "triangle",
      size: { width: "130px", height: "130px" },
      bg: "var(--color-accent)",
      pos: { bottom: "40%", left: "30%" },
      animate: {
        x: [-220, 320, -220],
        y: [-140, 230, -140],
        scale: [1, 1.1, 1],
      },
      duration: 14,
    },
    {
      type: "triangle",
      size: { width: "75px", height: "75px" },
      bg: "var(--color-primary)",
      pos: { top: "60%", left: "60%" },
      animate: { x: [150, -250, 150], y: [80, -170, 80], rotate: [0, 360] },
      duration: 10,
    },
    {
      type: "triangle",
      size: { width: "245px", height: "245px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "10%", right: "50%" },
      animate: { x: [-230, 310, -230], y: [-150, 240, -150] },
      duration: 19,
    },
    {
      type: "triangle",
      size: { width: "115px", height: "115px" },
      bg: "var(--color-accent)",
      pos: { top: "70%", left: "45%" },
      animate: { x: [180, -280, 180], y: [100, -190, 100] },
      duration: 12,
    },
    {
      type: "triangle",
      size: { width: "195px", height: "195px" },
      bg: "var(--color-primary)",
      pos: { bottom: "15%", left: "25%" },
      animate: { x: [-200, 300, -200], y: [-120, 210, -120] },
      duration: 16,
    },
    {
      type: "triangle",
      size: { width: "85px", height: "85px" },
      bg: "var(--color-secondary)",
      pos: { top: "35%", right: "55%" },
      animate: { x: [160, -260, 160], y: [90, -180, 90], rotate: [0, 180] },
      duration: 11,
    },
    {
      type: "triangle",
      size: { width: "225px", height: "225px" },
      bg: "var(--color-accent)",
      pos: { bottom: "50%", left: "70%" },
      animate: { x: [-240, 340, -240], y: [-130, 220, -130] },
      duration: 18,
    },
    {
      type: "triangle",
      size: { width: "145px", height: "145px" },
      bg: "var(--color-primary)",
      pos: { top: "60%", right: "20%" },
      animate: { x: [190, -290, 190], y: [110, -200, 110] },
      duration: 14,
    },
    {
      type: "triangle",
      size: { width: "175px", height: "175px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "30%", left: "55%" },
      animate: {
        x: [-210, 330, -210],
        y: [-140, 230, -140],
        scale: [1, 1.15, 1],
      },
      duration: 17,
    },
    {
      type: "triangle",
      size: { width: "95px", height: "95px" },
      bg: "var(--color-accent)",
      pos: { top: "80%", right: "35%" },
      animate: { x: [150, -250, 150], y: [80, -170, 80], rotate: [0, 360] },
      duration: 10,
    },

    // 30 מרובעים (60px-250px)
    {
      type: "square",
      size: { width: "60px", height: "60px" },
      bg: "var(--color-primary)",
      pos: { top: "15%", left: "20%" },
      animate: { x: [-200, 300, -200], y: [-100, 220, -100], rotate: [0, 360] },
      duration: 13,
    },
    {
      type: "square",
      size: { width: "250px", height: "250px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "20%", right: "25%" },
      animate: { x: [200, -320, 200], y: [150, -200, 150], scale: [1, 1.2, 1] },
      duration: 19,
    },
    {
      type: "square",
      size: { width: "150px", height: "150px" },
      bg: "var(--color-accent)",
      pos: { top: "70%", left: "30%" },
      animate: { x: [-220, 280, -220], y: [-130, 190, -130], rotate: [0, 180] },
      duration: 15,
    },
    {
      type: "square",
      size: { width: "120px", height: "120px" },
      bg: "var(--color-primary)",
      pos: { bottom: "35%", right: "15%" },
      animate: { x: [180, -260, 180], y: [100, -170, 100] },
      duration: 14,
    },
    {
      type: "square",
      size: { width: "200px", height: "200px" },
      bg: "var(--color-secondary)",
      pos: { top: "25%", left: "75%" },
      animate: {
        x: [-240, 340, -240],
        y: [-140, 230, -140],
        scale: [1, 1.1, 1],
      },
      duration: 18,
    },
    {
      type: "square",
      size: { width: "80px", height: "80px" },
      bg: "var(--color-accent)",
      pos: { bottom: "45%", right: "40%" },
      animate: { x: [150, -250, 150], y: [80, -180, 80], rotate: [0, 360] },
      duration: 11,
    },
    {
      type: "square",
      size: { width: "180px", height: "180px" },
      bg: "var(--color-primary)",
      pos: { top: "35%", left: "10%" },
      animate: { x: [-200, 300, -200], y: [-110, 210, -110] },
      duration: 16,
    },
    {
      type: "square",
      size: { width: "140px", height: "140px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "15%", left: "60%" },
      animate: { x: [170, -270, 170], y: [120, -190, 120] },
      duration: 13,
    },
    {
      type: "square",
      size: { width: "230px", height: "230px" },
      bg: "var(--color-accent)",
      pos: { top: "50%", right: "20%" },
      animate: {
        x: [-230, 310, -230],
        y: [-150, 240, -150],
        scale: [1, 1.15, 1],
      },
      duration: 17,
    },
    {
      type: "square",
      size: { width: "100px", height: "100px" },
      bg: "var(--color-primary)",
      pos: { bottom: "25%", left: "35%" },
      animate: { x: [190, -290, 190], y: [100, -200, 100] },
      duration: 12,
    },
    {
      type: "square",
      size: { width: "190px", height: "190px" },
      bg: "var(--color-secondary)",
      pos: { top: "65%", right: "10%" },
      animate: { x: [-210, 330, -210], y: [-130, 220, -130] },
      duration: 15,
    },
    {
      type: "square",
      size: { width: "70px", height: "70px" },
      bg: "var(--color-accent)",
      pos: { bottom: "5%", left: "45%" },
      animate: { x: [160, -260, 160], y: [90, -180, 90], rotate: [0, 180] },
      duration: 14,
    },
    {
      type: "square",
      size: { width: "245px", height: "245px" },
      bg: "var(--color-primary)",
      pos: { top: "20%", right: "55%" },
      animate: { x: [-250, 350, -250], y: [-140, 230, -140] },
      duration: 19,
    },
    {
      type: "square",
      size: { width: "160px", height: "160px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "40%", left: "20%" },
      animate: { x: [180, -280, 180], y: [110, -190, 110], scale: [1, 1.2, 1] },
      duration: 16,
    },
    {
      type: "square",
      size: { width: "90px", height: "90px" },
      bg: "var(--color-accent)",
      pos: { top: "75%", left: "65%" },
      animate: { x: [-200, 300, -200], y: [-100, 210, -100], rotate: [0, 360] },
      duration: 11,
    },
    {
      type: "square",
      size: { width: "210px", height: "210px" },
      bg: "var(--color-primary)",
      pos: { bottom: "30%", right: "30%" },
      animate: { x: [170, -270, 170], y: [120, -200, 120] },
      duration: 18,
    },
    {
      type: "square",
      size: { width: "110px", height: "110px" },
      bg: "var(--color-secondary)",
      pos: { top: "40%", left: "50%" },
      animate: { x: [-230, 310, -230], y: [-130, 220, -130] },
      duration: 13,
    },
    {
      type: "square",
      size: { width: "185px", height: "185px" },
      bg: "var(--color-accent)",
      pos: { bottom: "10%", left: "75%" },
      animate: { x: [190, -290, 190], y: [110, -190, 110], scale: [1, 1.1, 1] },
      duration: 15,
    },
    {
      type: "square",
      size: { width: "130px", height: "130px" },
      bg: "var(--color-primary)",
      pos: { top: "55%", right: "35%" },
      animate: { x: [-210, 330, -210], y: [-140, 230, -140] },
      duration: 17,
    },
    {
      type: "square",
      size: { width: "75px", height: "75px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "50%", left: "15%" },
      animate: { x: [150, -250, 150], y: [80, -170, 80], rotate: [0, 180] },
      duration: 12,
    },
    {
      type: "square",
      size: { width: "235px", height: "235px" },
      bg: "var(--color-accent)",
      pos: { top: "30%", left: "30%" },
      animate: {
        x: [-240, 340, -240],
        y: [-150, 240, -150],
        scale: [1, 1.15, 1],
      },
      duration: 19,
    },
    {
      type: "square",
      size: { width: "145px", height: "145px" },
      bg: "var(--color-primary)",
      pos: { bottom: "20%", right: "60%" },
      animate: { x: [180, -280, 180], y: [100, -200, 100] },
      duration: 14,
    },
    {
      type: "square",
      size: { width: "195px", height: "195px" },
      bg: "var(--color-secondary)",
      pos: { top: "45%", left: "40%" },
      animate: { x: [-200, 300, -200], y: [-120, 210, -120] },
      duration: 16,
    },
    {
      type: "square",
      size: { width: "85px", height: "85px" },
      bg: "var(--color-accent)",
      pos: { bottom: "35%", left: "70%" },
      animate: { x: [170, -270, 170], y: [90, -180, 90], rotate: [0, 360] },
      duration: 11,
    },
    {
      type: "square",
      size: { width: "240px", height: "240px" },
      bg: "var(--color-primary)",
      pos: { top: "60%", right: "25%" },
      animate: { x: [-230, 310, -230], y: [-130, 220, -130] },
      duration: 18,
    },
    {
      type: "square",
      size: { width: "165px", height: "165px" },
      bg: "var(--color-secondary)",
      pos: { bottom: "15%", left: "50%" },
      animate: { x: [190, -290, 190], y: [110, -190, 110], scale: [1, 1.2, 1] },
      duration: 15,
    },
    {
      type: "square",
      size: { width: "65px", height: "65px" },
      bg: "var(--color-accent)",
      pos: { top: "70%", right: "45%" },
      animate: { x: [-210, 330, -210], y: [-100, 210, -100], rotate: [0, 180] },
      duration: 12,
    },
    {
      type: "square",
      size: { width: "205px", height: "205px" },
      bg: "var(--color-primary)",
      pos: { bottom: "25%", left: "20%" },
      animate: { x: [150, -250, 150], y: [120, -200, 120] },
      duration: 17,
    },
    {
      type: "square",
      size: { width: "140px", height: "140px" },
      bg: "var(--color-secondary)",
      pos: { top: "35%", right: "15%" },
      animate: { x: [-240, 340, -240], y: [-140, 230, -140] },
      duration: 14,
    },
    {
      type: "square",
      size: { width: "175px", height: "175px" },
      bg: "var(--color-accent)",
      pos: { bottom: "40%", left: "60%" },
      animate: { x: [180, -280, 180], y: [100, -190, 100], scale: [1, 1.1, 1] },
      duration: 16,
    },
  ];

  return (
    <>
      {shapes.map((shape, idx) => (
        <motion.div
          key={idx}
          className={`absolute opacity-15 ${
            shape.type === "circle"
              ? "rounded-full"
              : shape.type === "triangle"
              ? "triangle"
              : "square"
          }`}
          style={{
            background: shape.bg,
            ...shape.pos,
            ...shape.size,
            zIndex: 0,
          }}
          initial={{ x: 0, y: 0 }}
          animate={shape.animate}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <style>{`
        .triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
        .square {
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
      `}</style>
    </>
  );
};

const ChatBot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    try {
      const response = await axiosInstance.post("/chatAi", { message: input });
      setMessages((prev) => [
        ...prev,
        { text: response.data.reply, sender: "bot" },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { text: "שגיאה בתקשורת עם השרת", sender: "bot" },
      ]);
    }
    setInput("");
  };

  return ReactDOM.createPortal(
    <div className="fixed bottom-16 right-2 z-50">
      {/* כפתור הצ'אט – מוצג רק כאשר החלון סגור */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="bg-secondary text-button-text p-3 rounded-full shadow-lg hover:bg-secondary animate-fade-in"
        >
          צ'אט
        </button>
      )}

      {/* חלון הצ'אט – מוצג כאשר isChatOpen=true */}
      {isChatOpen && (
        <div className="mt-2 w-80 h-96 bg-bg shadow-lg rounded-lg flex flex-col animate-fade-in animate-slide-down">
          <div className="bg-primary text-button-text p-2 rounded-t-lg flex justify-between animate-slide-in">
            <span>צ'אט בוט</span>
            <button onClick={toggleChat} className="text-button-text">
              ✕
            </button>
          </div>
          <div className="flex-1 p-2 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-secondary text-white"
                      : "bg-accent text-white"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-border-color">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="w-full p-2 border border-border-color rounded placeholder:text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="כתוב הודעה..."
            />
            <button
              onClick={sendMessage}
              className="mt-2 w-full bg-secondary text-button-text p-2 rounded hover:bg-secondary transition-colors duration-200"
            >
              שלח
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

const Layout = ({ children }) => {
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isAdmin = authUser?.role === "Admin";
  const currentPlan = authUser?.pack || "No Plan";

  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsDropdownOpen(false);
  };

  const directionMap = {
    en: "ltr",
    he: "rtl",
    ru: "ltr",
    es: "ltr",
    fr: "ltr",
    ar: "rtl",
    ja: "ltr",
  };

  const flagMap = {
    en: "us",
    he: "il",
    ru: "ru",
    es: "es",
    fr: "fr",
    ar: "sa",
    ja: "jp",
  };

  useEffect(() => {
    const currentLang = i18n.language;
    const direction = directionMap[currentLang] || "ltr";
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  const isRTL = directionMap[i18n.language] === "rtl";

  return (
    <div
      className={`flex flex-col min-h-screen w-full bg-gradient-to-br from-bg to-bg animate-fade-in ${
        isRTL ? "font-hebrew" : "font-sans"
      }`}
    >
      <Navbar isRTL={isRTL} />

      {ReactDOM.createPortal(<DesignBox />, document.body)}

      <div className="flex flex-grow w-full relative z-10">
        {isAdmin && (
          <div
            className={`hidden xl:block fixed top-0 bottom-0 ${
              isRTL ? "right-0" : "left-0"
            } w-64 shadow-xl animate-slide-in h-screen z-50`}
          >
            <SideBar isRTL={isRTL} />
          </div>
        )}
        <main
          className={`flex-grow w-full px-4 sm:px-6 md:px-8 2xl:px-12 pt-2 ${
            isAdmin
              ? isRTL
                ? "md:pr-0 lg:pr-0 xl:pr-64 2xl:pr-64"
                : "md:pl-0 lg:pl-0 xl:pl-64 2xl:pl-64"
              : ""
          }`}
        >
          <div className="relative pt-16 pb-12 overflow-hidden">
            {authUser && <AnimatedShapes />}
            {authUser && <ChatBot />}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-3 xl:px-6 xl:py-3 bg-gradient-to-r from-primary to-secondary text-button-text rounded-full shadow-sm hover:shadow-md transition-all duration-200 z-20"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <FaGlobe
                  className={`w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 ${
                    isRTL ? "ml-2" : "mr-2"
                  }`}
                />
                <span className="truncate font-semibold">
                  {t("language.change_language")}
                </span>
              </button>

              {authUser && (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-3 xl:px-6 xl:py-3 bg-gradient-to-r from-accent to-primary text-button-text rounded-full shadow-sm hover:shadow-md transition-all duration-200 z-20"
                  onClick={() => setIsPricingModalOpen(true)}
                >
                  <GrUpdate
                    className={`w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 ${
                      isRTL ? "ml-2" : "mr-2"
                    }`}
                  />
                  <span className="truncate font-semibold">
                    {t("layout.upgrade")} {currentPlan}
                  </span>
                </button>
              )}
            </div>

            {isDropdownOpen && (
              <div
                className={`absolute ${
                  isRTL ? "right-0" : "left-0"
                } mt-2 bg-white shadow-2xl rounded-xl z-20 w-48 sm:w-56 xl:w-64 max-h-64 overflow-y-auto border border-border-color animate-slide-down`}
              >
                {Object.keys(flagMap).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => changeLanguage(lng)}
                    className={`flex items-center px-3 py-2 sm:px-4 sm:py-3 xl:px-5 xl:py-3 text-text hover:bg-accent hover:text-button-text w-full ${
                      isRTL ? "text-right" : "text-left"
                    } text-sm sm:text-base xl:text-lg transition-all duration-200`}
                  >
                    <Flag
                      code={flagMap[lng]}
                      className={`w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 ${
                        isRTL ? "ml-2" : "mr-2"
                      } rounded-full shadow-sm`}
                    />
                    <span className="truncate">{t(`${lng}`)}</span>
                  </button>
                ))}
              </div>
            )}

            {isPricingModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-down relative">
                  <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    onClick={() => setIsPricingModalOpen(false)}
                  >
                    ✕
                  </button>
                  <PricingPlans currentPlan={currentPlan} />
                </div>
              </div>
            )}

            <div className={isRTL ? "text-right" : "text-left"}>{children}</div>
          </div>
        </main>
      </div>

      <Footer isRTL={isRTL} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(${
            isRTL ? "20px" : "-20px"
          }); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Layout;
