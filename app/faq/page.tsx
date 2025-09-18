import React from "react";
import Header from "../../components/Header";

export default function FAQ() {
  const faqs = [
    {
      question: "What is this website about?",
      answer:
        "This website is dedicated to exploring and sharing the rich lore and stories of our fictional universe. You can discover various characters, locations, and events that make up our world.",
    },
    {
      question: "How do I navigate the lore?",
      answer:
        "You can browse through different lore entries on the Lore page. Each entry contains detailed information about characters, locations, or events. Click on any lore card to read the full story.",
    },
    {
      question: "Can I contribute to the lore?",
      answer:
        "Currently, the lore is curated by our team. However, we're always open to feedback and suggestions from our community members.",
    },
    {
      question: "Is this content free to access?",
      answer:
        "Yes, all lore content on this website is completely free to access and read. We believe in sharing our stories with everyone.",
    },
    {
      question: "How often is new content added?",
      answer:
        "We regularly update our lore with new stories, characters, and events. Check back frequently to discover new content.",
    },
    {
      question: "Can I share the lore with others?",
      answer:
        "Absolutely! Feel free to share our lore with friends and family. We encourage spreading the stories and building our community.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-title">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-300 font-text">
            Find answers to common questions about our lore and website
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
          <p className="text-gray-400 mb-4 font-text">Still have questions?</p>
          <button className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
