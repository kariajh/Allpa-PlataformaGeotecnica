# Carpetas principales
mkdir app\core
mkdir app\db
mkdir app\shared
mkdir tests\unit
mkdir tests\integration
mkdir scripts

foreach ($mod in "auth","proyectos","sondeos","ensayos","estratigrafia","multimedia","sync","dispositivos","auditoria") {
    mkdir "app\modules\$mod"
    New-Item "app\modules\$mod\__init__.py" -ItemType File
    New-Item "app\modules\$mod\router.py" -ItemType File
    New-Item "app\modules\$mod\schemas.py" -ItemType File
    New-Item "app\modules\$mod\service.py" -ItemType File
    New-Item "app\modules\$mod\models.py" -ItemType File
}

# __init__.py de paquetes
New-Item "app\__init__.py" -ItemType File
New-Item "app\core\__init__.py" -ItemType File
New-Item "app\db\__init__.py" -ItemType File
New-Item "app\shared\__init__.py" -ItemType File
New-Item "app\modules\__init__.py" -ItemType File

# Archivos de core/db/shared
New-Item "app\core\config.py" -ItemType File
New-Item "app\core\security.py" -ItemType File
New-Item "app\core\database.py" -ItemType File
New-Item "app\core\exceptions.py" -ItemType File
New-Item "app\db\base.py" -ItemType File
New-Item "app\db\session.py" -ItemType File
New-Item "app\shared\enums.py" -ItemType File
New-Item "app\shared\mixins.py" -ItemType File

# main.py y archivos de configuración del proyecto
New-Item "app\main.py" -ItemType File
New-Item ".env.example" -ItemType File
New-Item ".env" -ItemType File
New-Item ".gitignore" -ItemType File