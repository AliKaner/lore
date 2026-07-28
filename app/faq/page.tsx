"use client";
import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLocale } from "@/hooks/useLocale";

export default function FAQ() {
  const { t } = useLocale();

  const faqs = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
    { question: t("faq.q6"), answer: t("faq.a6") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-title">
            {t("faq.title")}
          </h1>
          <p className="text-xl text-gray-300 font-text">
            {t("faq.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all duration-300"
            >
              <h3 className="text-xl font-semibold text-white mb-3 font-title">
                {faq.question}
              </h3>
              <p className="text-gray-300 leading-relaxed font-text">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4 font-text">{t("faq.stillHaveQuestions")}</p>
          <button className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300">
            {t("faq.contactUs")}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
