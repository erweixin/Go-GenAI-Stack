// atlas.hcl
// Atlas 配置文件
// 文档: https://atlasgo.io/

env "local" {
  src = "file://infrastructure/database/schema"
  dev = "docker://postgres/15/dev?search_path=public"
  url = env("DATABASE_URL")
  
  migration {
    dir = "file://migrations/atlas"
    format = atlas
  }
  
  diff {
    skip {
      drop_schema = true
      drop_table  = false
    }
  }
  
  lint {
    review = WARNING
    
    destructive {
      error = true
    }
    
    data_depend {
      error = false
    }
  }
}

env "dev" {
  src = "file://infrastructure/database/schema"
  dev = "docker://postgres/15/dev?search_path=public"
  url = getenv("DATABASE_URL")
  
  migration {
    dir = "file://migrations/atlas"
    format = atlas
  }
  
  diff {
    skip {
      drop_schema = true
      drop_table  = false
    }
  }
}

env "test" {
  src = "file://infrastructure/database/schema"
  dev = "docker://postgres/15/dev?search_path=public"
  url = "postgresql://postgres:postgres@localhost:5432/go_genai_stack_test?sslmode=disable"
  
  migration {
    dir = "file://migrations/atlas"
    format = atlas
  }
}

env "prod" {
  src = "file://infrastructure/database/schema"
  url = getenv("DATABASE_URL")
  
  migration {
    dir = "file://migrations/atlas"
    format = atlas
    baseline = getenv("MIGRATION_BASELINE")
  }
  
  diff {
    skip {
      drop_schema = true
      drop_table  = true
    }
  }
  
  lint {
    review = ERROR
    
    destructive {
      error = true
    }
    
    data_depend {
      error = true
    }
  }
}

