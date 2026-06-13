\"use client\";

import { useState } from \"react\";
import { Search, Filter, Plus, Target, Users, Clock, TrendingUp, MoreHorizontal, UserPlus, FileText, Send } from \"lucide-react\";
import { Button } from \"@/components/ui/Button\";
import LeadWizard from \"./LeadWizard\";

export default function LeadHub() {
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState(\"all\");

  const stats = [
    { label: \"Total Leads\", value: \"482\", icon: Target, color: \"text-blue-600\", bg: \"bg-blue-50\" },
    { label: \"Warm Leads\", value: \"124\", icon: TrendingUp, color: \"text-orange-600\", bg: \"bg-orange-50\" },
    { label: \"Converted\", value: \"64\", icon: Users, color: \"text-green-600\", bg: \"bg-green-50\" },
    { label: \"Lost\", value: \"12\", icon: Clock, color: \"text-red-600\", bg: \"bg-red-50\" },
  ];

  const leads = [
    { id: \"LEAD-101\", name: \"Rahul Sharma\", company: \"Tech Mahindra\", source: \"LinkedIn\", status: \"Warm\", assigned: \"Amit\", date: \"2 hours ago\" },
    { id: \"LEAD-102\", name: \"Sarah Jones\", company: \"Acme Corp\", source: \"Website\", status: \"Cold\", assigned: \"Sonia\", date: \"5 hours ago\" },
    { id: \"LEAD-103\", name: \"Vikram Singh\", company: \"HDFC Bank\", source: \"Referral\", status: \"Closed\", assigned: \"Raj\", date: \"Yesterday\" },
  ];

  if (showWizard) {
    return (
      <div className=\"space-y-6\">
        <div className=\"flex items-center gap-4\">
          <Button variant=\"outline\" onClick={() => setShowWizard(false)} className=\"rounded-xl\">
            Back to Hub
          </Button>
          <h2 className=\"text-xl font-black text-primary\">Lead Generation Wizard</h2>
        </div>
        <LeadWizard />
      </div>
    );
  }

  return (
    <div className=\"space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700\">
      {/* Header Section */}
      <div className=\"flex justify-between items-end\">
        <div>
          <h2 className=\"text-3xl font-black text-primary tracking-tight\">Leads Management</h2>
          <p className=\"text-secondary font-medium mt-1\">Monitor and convert your sales pipeline.</p>
        </div>
        <div className=\"flex gap-3\">
           <button className=\"flex items-center gap-2 px-6 py-3 bg-white border border-border rounded-2xl text-xs font-black text-secondary hover:bg-slate-50 transition-all\">
              <Filter size={16} /> Advanced Filters
           </button>
           <button onClick={() => setShowWizard(true)} className=\"flex items-center gap-2 px-6 py-3 bg-accent text-primary rounded-2xl text-xs font-black shadow-lg hover:shadow-accent/10 transition-all\">
              <Plus size={18} /> Create New Lead
           </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        {stats.map((stat, i) => (
          <div key={i} className=\"bg-white p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-5\">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className=\"text-[10px] font-black text-slate-400 uppercase tracking-widest\">{stat.label}</p>
              <p className=\"text-2xl font-black text-primary mt-0.5\">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lead List Table */}
      <div className=\"bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden\">
        <div className=\"p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6\">
          <div className=\"flex gap-2 p-1 bg-slate-50 rounded-xl\">
            {[\"all\", \"warm\", \"cold\", \"closed\"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? \"bg-white text-primary shadow-sm ring-1 ring-slate-100\" : \"text-slate-400 hover:text-secondary\"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className=\"relative w-full md:w-80\">
            <Search className=\"absolute left-4 top-1/2 -translate-y-1/2 text-slate-300\" size={18} />
            <input 
              type=\"text\" 
              placeholder=\"Search leads by name or company...\" 
              className=\"w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-border rounded-2xl text-xs font-medium outline-none focus:ring-4 focus:ring-accent/10 transition-all\"
            />
          </div>
        </div>

        <div className=\"overflow-x-auto\">
          <table className=\"w-full text-left\">
            <thead className=\"bg-slate-50/50\">
              <tr>
                <th className=\"p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest\">Lead Detail</th>
                <th className=\"p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest\">Source</th>
                <th className=\"p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest\">Assigned</th>
                <th className=\"p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest\">Status</th>
                <th className=\"p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest\">Actions</th>
              </tr>
            </thead>
            <tbody className=\"divide-y divide-slate-50\">
              {leads.map((lead) => (
                <tr key={lead.id} className=\"group hover:bg-slate-50/30 transition-all\">
                  <td className=\"p-6\">
                    <div className=\"flex items-center gap-4\">
                      <div className=\"w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-primary group-hover:text-white transition-all\">
                        {lead.name.split(\" \").map(n => n[0]).join(\"\")}
                      </div>
                      <div>
                        <p className=\"font-bold text-primary text-sm\">{lead.name}</p>
                        <p className=\"text-[10px] text-slate-400 font-bold uppercase tracking-widest\">{lead.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className=\"p-6\">\n                    <span className=\"px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-tighter\">{lead.source}</span>\n                  </td>
                  <td className=\"p-6\">\n                    <div className=\"flex items-center gap-2\">\n                       <div className=\"w-2 h-2 rounded-full bg-accent\"></div>\n                       <span className=\"text-xs font-bold text-secondary\">{lead.assigned}</span>\n                    </div>\n                  </td>
                  <td className=\"p-6\">\n                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${\n                      lead.status === \"Warm\" ? \"bg-orange-50 text-orange-600 border-orange-100\" : \n                      lead.status === \"Closed\" ? \"bg-green-50 text-green-600 border-green-100\" : \"bg-slate-50 text-slate-500 border-slate-100\"\n                    }`}>\n                      {lead.status}\n                    </span>\n                  </td>
                  <td className=\"p-6 text-right\">\n                    <button className=\"p-2 text-slate-300 hover:text-primary transition-all\"><MoreHorizontal size={20} /></button>\n                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className=\"p-6 bg-slate-50/50 border-t border-slate-50 text-center\">\n           <button className=\"text-[10px] font-black text-primary uppercase tracking-widest hover:underline\">Load More Leads</button>\n        </div>
      </div>
    </div>
  );
}
