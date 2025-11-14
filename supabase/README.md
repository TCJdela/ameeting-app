# Supabase 配置信息

## 数据库表结构

项目使用以下数据库表：

### users 表
- id: UUID (主键)
- email: VARCHAR(255) (唯一)
- password_hash: VARCHAR(255)
- name: VARCHAR(100)
- plan: VARCHAR(20) (默认 'free')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### audio_files 表
- id: UUID (主键)
- user_id: UUID (外键)
- filename: VARCHAR(255)
- original_name: VARCHAR(255)
- file_size: INTEGER
- file_path: VARCHAR(500)
- duration: INTEGER
- title: VARCHAR(255)
- created_at: TIMESTAMP

### transcripts 表
- id: UUID (主键)
- audio_file_id: UUID (外键)
- user_id: UUID (外键)
- original_text: TEXT
- edited_text: TEXT
- language: VARCHAR(10) (默认 'zh')
- status: VARCHAR(20) (默认 'processing')
- progress: FLOAT (默认 0)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### meeting_notes 表
- id: UUID (主键)
- transcript_id: UUID (外键)
- user_id: UUID (外键)
- content: TEXT
- key_points: TEXT
- action_items: TEXT
- decisions: TEXT
- template_type: VARCHAR(50) (默认 'standard')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

## 环境变量配置

在 `.env` 文件中添加以下配置：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## 权限设置

确保在 Supabase 中设置以下 RLS (Row Level Security) 规则：

```sql
-- 授予匿名用户基本读取权限
GRANT SELECT ON users TO anon;
GRANT SELECT ON audio_files TO anon;
GRANT SELECT ON transcripts TO anon;
GRANT SELECT ON meeting_notes TO anon;

-- 授予认证用户完整权限
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON audio_files TO authenticated;
GRANT ALL PRIVILEGES ON transcripts TO authenticated;
GRANT ALL PRIVILEGES ON meeting_notes TO authenticated;
```

## Storage 配置

创建名为 `audio-files` 的存储桶，用于保存音频文件。