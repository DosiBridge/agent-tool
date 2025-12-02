"""
RAG (Retrieval Augmented Generation) system with FAISS vectorstore
"""
import os
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_classic.chains import create_retrieval_chain, create_history_aware_retriever
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from .history import history_manager
from src.core import Config


class EnhancedRAGSystem:
    """Enhanced RAG system with better context retrieval and history awareness"""
    
    def __init__(self):
        """Initialize the RAG system with DOSIBridge context"""
        self.texts = [
            "DOSIBridge (Digital Operations Software Innovation) is a technology company focused on AI and automation solutions.",
            "DOSIBridge was founded in 2025 and is an innovative team using AI to enhance digital operations and software solutions.",
            "DOSIBridge builds research systems that drive business growth, development, and engineering excellence.",
            "DOSIBridge's mission is to help businesses grow smarter with AI & Automation.",
            "DOSIBridge uses Artificial Intelligence (AI) and automation to help businesses work faster, save time, and make better decisions.",
            "DOSIBridge provides cutting-edge solutions that empower organizations to streamline operations, reduce manual workloads, and unlock new levels of productivity through intelligent automation and data-driven insights.",
            "DOSIBridge's core values include: providing automation services that drive efficiency and reduce operational costs, building a strong open-source community to foster innovation and collaboration, and pursuing continuous learning to stay ahead in technology trends and best practices.",
            "DOSIBridge specializes in technologies including: AI, .NET, Python, GoLang, Angular, Next.js, Docker, DevOps, Azure, AWS, and system design.",
            "DOSIBridge builds with AI, .NET, Python, and Go to power Digitalized Operations.",
            "DOSIBridge Team - Mihadul Islam: CEO & Founder. Mihadul Islam is a .NET engineer skilled in Python, AI, automation, Docker, DevOps, Azure, AWS, and system design. He is the CEO and Founder of DOSIBridge.",
            "DOSIBridge Team - Abdullah Al Sazib: Co-Founder & CTO. Abdullah Al Sazib is a GoLang and Next.js expert passionate about Angular, research, and continuous learning in tech innovation. He is the Co-Founder and CTO of DOSIBridge.",
            "The DOSIBridge team consists of brilliant minds behind the company's success, including Mihadul Islam (CEO & Founder) and Abdullah Al Sazib (Co-Founder & CTO).",
            "DOSIBridge shares quick tips on AI, .NET, GoLang and modern development through their newsletter, blog, and social media channels.",
            "DOSIBridge has over 14,000 subscribers to their newsletter.",
            "DOSIBridge maintains active presence on GitHub, LinkedIn, Twitter/X, Facebook, and YouTube.",
            "DOSIBridge focuses on Digital Operations, Software Innovation, and AI automation to power digitalized operations.",
            "DOSIBridge partners with businesses to unlock digital potential and achieve sustainable growth through technology and innovation.",
            "DOSIBridge is ready to transform businesses and help them achieve sustainable growth through technology and innovation.",
        ]
        
        try:
            # OPENAI_API_KEY from environment is ONLY for embeddings (RAG)
            # This is separate from the LLM model API key stored in database
            # This allows RAG to work even if the main LLM is Gemini/Ollama
            openai_api_key = os.getenv("OPENAI_API_KEY")
            
            if not openai_api_key:
                raise ValueError(
                    "OpenAI API key is required for FAISS embeddings. "
                    "Please set OPENAI_API_KEY environment variable. "
                    "Note: This is ONLY for embeddings, not for the LLM model."
                )
            
            self.embeddings = OpenAIEmbeddings(api_key=openai_api_key)
            self.vectorstore = FAISS.from_texts(self.texts, embedding=self.embeddings)
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
            self.available = True
            print("✓ Enhanced RAG System initialized with FAISS vectorstore")
        except Exception as e:
            print(f"⚠️  FAISS not available, RAG tool disabled: {e}")
            self.available = False
    
    def retrieve_context(self, query: str) -> str:
        """Retrieve relevant context for a query"""
        if not self.available:
            return "RAG system not available."
        
        try:
            docs = self.retriever.invoke(query)
            if docs:
                contexts = [doc.page_content for doc in docs]
                return "\n".join(contexts)
            return "No relevant context found."
        except Exception as e:
            return f"Error retrieving context: {e}"
    
    def query_with_history(self, query: str, session_id: str, llm: ChatOpenAI) -> str:
        """
        Query the RAG system with conversation history
        
        Args:
            query: User's question
            session_id: Session identifier
            llm: Language model to use
            
        Returns:
            Answer with context from both RAG and history
        """
        if not self.available:
            return "RAG system not available."
        
        # Contextualization prompt for history-aware retrieval
        contextualize_prompt = ChatPromptTemplate.from_messages([
            ("system", 
             "Given a chat history and the latest user question, "
             "formulate a standalone question which can be understood without the chat history. "
             "Do NOT answer the question, just reformulate it if needed."),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        # Answer prompt
        answer_prompt = ChatPromptTemplate.from_messages([
            ("system", 
             "You are the official AI assistant for dosibridge.com, trained and maintained by the DOSIBridge team.\n\n"
             "DOSIBridge (Digital Operations Software Innovation) was founded in 2025 and is an innovative team using AI to enhance digital operations and software solutions. "
             "DOSIBridge builds research systems that drive business growth, development, and engineering excellence.\n\n"
             "DOSIBridge's mission is to help businesses grow smarter with AI & Automation. "
             "We specialize in AI, .NET, Python, GoLang, Angular, Next.js, Docker, DevOps, Azure, AWS, and system design.\n\n"
             "DOSIBridge Team Members:\n"
             "- Mihadul Islam (CEO & Founder): .NET engineer skilled in Python, AI, automation, Docker, DevOps, Azure, AWS, and system design.\n"
             "- Abdullah Al Sazib (Co-Founder & CTO): GoLang and Next.js expert passionate about Angular, research, and continuous learning in tech innovation.\n\n"
             "Your role is to provide accurate, secure, and helpful responses related to DOSIBridge products, services, and workflows.\n\n"
             "When asked about your identity, respond: 'I am the DOSIBridge AI Agent, developed and trained by the DOSIBridge team to assist with product support, automation guidance, and technical workflows across the DOSIBridge platform.'\n\n"
             "When asked about DOSIBridge team members, provide detailed information about Mihadul Islam (CEO & Founder) and Abdullah Al Sazib (Co-Founder & CTO), including their roles, expertise, and contributions.\n\n"
             "Context: {context}\n\n"
             "Rules:\n"
             "- Answer naturally without mentioning 'the context' or 'according to the context'\n"
             "- If you don't know, say so honestly\n"
             "- Be concise and helpful\n"
             "- When discussing team members, mention their full names, titles, and expertise areas\n"
             "- If a question is outside DOSIBridge's scope, respond professionally and redirect when appropriate\n"
             "- Do not claim affiliation with any external AI vendor unless explicitly instructed"),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        # Create history-aware retriever
        history_aware_retriever = create_history_aware_retriever(
            llm, self.retriever, contextualize_prompt
        )
        
        # Create question answering chain
        question_answer_chain = create_stuff_documents_chain(llm, answer_prompt)
        
        # Create retrieval chain
        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
        
        # Wrap with history
        conversational_rag_chain = RunnableWithMessageHistory(
            rag_chain,
            lambda sid: history_manager.get_session_history(sid),
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        )
        
        # Execute query
        result = conversational_rag_chain.invoke(
            {"input": query},
            config={"configurable": {"session_id": session_id}},
        )
        
        return result["answer"]


# Global RAG system instance
rag_system = EnhancedRAGSystem()

