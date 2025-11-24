// atlas.hcl
// Atlas 配置文件
// 文档: https://atlasgo.io/
//
// 环境变量说明：
// - APP_DATABASE_* 变量用于 Go 后端
// - POSTGRES_* 变量用于 Docker Compose
// - Atlas 优先使用 APP_DATABASE_* 变量，回退到 POSTGRES_* 变量

// 本地开发环境
env "local" {
  src = "file://../../infrastructure/database/schema"
  dev = "docker://postgres/15/dev?search_path=public"
  
  // URL 通过环境变量拼接
  // 格式: postgresql://user:password@host:port/database?sslmode=disable
  url = format(
    "postgresql://%s:%s@%s:%s/%s?sslmode=%s",
    getenv("APP_DATABASE_USER") != "" ? getenv("APP_DATABASE_USER") : getenv("POSTGRES_USER") != "" ? getenv("POSTGRES_USER") : "genai",
    getenv("APP_DATABASE_PASSWORD") != "" ? getenv("APP_DATABASE_PASSWORD") : getenv("POSTGRES_PASSWORD") != "" ? getenv("POSTGRES_PASSWORD") : "genai_password",
    getenv("APP_DATABASE_HOST") != "" ? getenv("APP_DATABASE_HOST") : getenv("POSTGRES_HOST") != "" ? getenv("POSTGRES_HOST") : "localhost",
    getenv("APP_DATABASE_PORT") != "" ? getenv("APP_DATABASE_PORT") : "5432",
    getenv("APP_DATABASE_DATABASE") != "" ? getenv("APP_DATABASE_DATABASE") : getenv("POSTGRES_DB") != "" ? getenv("POSTGRES_DB") : "go_genai_stack",
    getenv("APP_DATABASE_SSL_MODE") != "" ? getenv("APP_DATABASE_SSL_MODE") : "disable"
  )
  
  migration {
    dir = "file://migrations"
  }
  
  diff {
    skip {
      drop_schema = true
      drop_table  = false
    }
  }
  
  lint {
    review = "WARNING"
    
    destructive {
      error = true
    }
    
    data_depend {
      error = false
    }
  }
}

// 开发环境（与 local 相同）
env "dev" {
  src = "file://../../infrastructure/database/schema"
  dev = "docker://postgres/15/dev?search_path=public"
  
  url = format(
    "postgresql://%s:%s@%s:%s/%s?sslmode=%s",
    getenv("APP_DATABASE_USER") != "" ? getenv("APP_DATABASE_USER") : getenv("POSTGRES_USER") != "" ? getenv("POSTGRES_USER") : "genai",
    getenv("APP_DATABASE_PASSWORD") != "" ? getenv("APP_DATABASE_PASSWORD") : getenv("POSTGRES_PASSWORD") != "" ? getenv("POSTGRES_PASSWORD") : "genai_password",
    getenv("APP_DATABASE_HOST") != "" ? getenv("APP_DATABASE_HOST") : getenv("POSTGRES_HOST") != "" ? getenv("POSTGRES_HOST") : "localhost",
    getenv("APP_DATABASE_PORT") != "" ? getenv("APP_DATABASE_PORT") : "5432",
    getenv("APP_DATABASE_DATABASE") != "" ? getenv("APP_DATABASE_DATABASE") : getenv("POSTGRES_DB") != "" ? getenv("POSTGRES_DB") : "go_genai_stack",
    getenv("APP_DATABASE_SSL_MODE") != "" ? getenv("APP_DATABASE_SSL_MODE") : "disable"
  )
  
  migration {
    dir = "file://migrations"
  }
  
  diff {
    skip {
      drop_schema = true
      drop_table  = false
    }
  }
}

// 测试环境
env "test" {
  src = "file://../../infrastructure/database/schema"
  dev = "docker://postgres/15/dev?search_path=public"
  
  // 测试环境使用固定配置
  url = "postgresql://genai:genai_password@localhost:5432/go_genai_stack_test?sslmode=disable"
  
  migration {
    dir = "file://migrations"
  }
}

// 生产环境
env "prod" {
  src = "file://../../infrastructure/database/schema"
  
  // 生产环境：优先使用 DATABASE_URL，否则拼接
  url = getenv("DATABASE_URL") != "" ? getenv("DATABASE_URL") : format(
    "postgresql://%s:%s@%s:%s/%s?sslmode=%s",
    getenv("APP_DATABASE_USER"),
    getenv("APP_DATABASE_PASSWORD"),
    getenv("APP_DATABASE_HOST"),
    getenv("APP_DATABASE_PORT") != "" ? getenv("APP_DATABASE_PORT") : "5432",
    getenv("APP_DATABASE_DATABASE"),
    getenv("APP_DATABASE_SSL_MODE") != "" ? getenv("APP_DATABASE_SSL_MODE") : "require"
  )
  
  migration {
    dir = "file://."
    baseline = getenv("MIGRATION_BASELINE")
  }
  
  diff {
    skip {
      drop_schema = true
      drop_table  = true
    }
  }
  
  lint {
    review = "ERROR"
    
    destructive {
      error = true
    }
    
    data_depend {
      error = true
    }
  }
}

