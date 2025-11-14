import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';

export const exportToPDF = async (content: string, title: string = '会议纪要') => {
  try {
    const doc = new jsPDF();
    
    // 设置中文字体 (使用默认字体，可能需要额外配置中文字体)
    doc.setFont('helvetica');
    
    // 添加标题
    doc.setFontSize(20);
    doc.text(title, 20, 30);
    
    // 添加日期
    doc.setFontSize(12);
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 20, 50);
    
    // 添加内容
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, 70);
    
    // 保存PDF
    doc.save(`${title}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('导出PDF失败:', error);
    throw error;
  }
};

export const exportToMarkdown = (content: string, title: string = '会议纪要') => {
  try {
    const markdownContent = `# ${title}

生成时间: ${new Date().toLocaleString('zh-CN')}

---

${content}`;

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('导出Markdown失败:', error);
    throw error;
  }
};

export const exportToWord = async (content: string, title: string = '会议纪要') => {
  try {
    // 简单的HTML格式，适用于Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; margin: 40px; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 24px; }
          h3 { color: #6b7280; }
          p { margin: 12px 0; }
          ul, ol { margin: 12px 0; padding-left: 24px; }
          li { margin: 6px 0; }
          .metadata { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="metadata">生成时间: ${new Date().toLocaleString('zh-CN')}</div>
        ${marked(content)}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { 
      type: 'application/msword;charset=utf-8' 
    });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}-${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('导出Word失败:', error);
    throw error;
  }
};