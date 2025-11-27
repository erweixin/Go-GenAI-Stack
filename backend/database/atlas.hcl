// Atlas 配置文件
// 文档: https://atlasgo.io/

// 辅助函数：读取环境变量（支持回退和默认值）
locals {
  // 优先使用 POSTGRES_* 环境变量（Docker Compose 标准）
  // 回退到 APP_DATABASE_* （Go 后端配置）
  db_user     = getenv("POSTGRES_USER") != "" ? getenv("POSTGRES_USER") : (getenv("APP_DATABASE_USER") != "" ? getenv("APP_DATABASE_USER") : "genai")
  db_password = getenv("POSTGRES_PASSWORD") != "" ? getenv("POSTGRES_PASSWORD") : (getenv("APP_DATABASE_PASSWORD") != "" ? getenv("APP_DATABASE_PASSWORD") : "genai_password")
  db_host     = getenv("POSTGRES_HOST") != "" ? getenv("POSTGRES_HOST") : (getenv("APP_DATABASE_HOST") != "" ? getenv("APP_DATABASE_HOST") : "localhost")
  db_port     = getenv("POSTGRES_PORT") != "" ? getenv("POSTGRES_PORT") : (getenv("APP_DATABASE_PORT") != "" ? getenv("APP_DATABASE_PORT") : "5432")
  db_name     = getenv("POSTGRES_DB") != "" ? getenv("POSTGRES_DB") : (getenv("APP_DATABASE_DATABASE") != "" ? getenv("APP_DATABASE_DATABASE") : "go_genai_stack")
}

// 开发环境（默认）
env "dev" {
  src = "file://schema.sql"
  dev = "docker://postgres/16/dev?search_path=public"
  
  // 使用 locals 构建连接字符串
  url = "postgresql://${local.db_user}:${local.db_password}@${local.db_host}:${local.db_port}/${local.db_name}?sslmode=disable"
  
  migration {
    dir = "file://migrations"
  }
}

// 生产环境
env "prod" {
  src = "file://schema.sql"
  
  // 优先使用 DATABASE_URL，否则使用 APP_DATABASE_* 变量
  url = getenv("DATABASE_URL") != "" ? getenv("DATABASE_URL") : "postgresql://${getenv("APP_DATABASE_USER")}:${getenv("APP_DATABASE_PASSWORD")}@${getenv("APP_DATABASE_HOST")}:${getenv("APP_DATABASE_PORT") != "" ? getenv("APP_DATABASE_PORT") : "5432"}/${getenv("APP_DATABASE_DATABASE")}?sslmode=require"
  
  migration {
    dir = "file://migrations"
  }
  
  // 生产环境安全策略
  diff {
    skip {
      drop_schema = true  // 禁止删除 schema
      drop_table  = true  // 禁止删除表
    }
  }
  
  lint {
    destructive {
      error = true  // 破坏性操作报错
    }
  }
}

