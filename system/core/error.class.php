<?php
/**
 * @author YAY!Scripting
 * @package files
 */
namespace System;

/** Error handler
 * 
 * This helper handles errors and uncaught exceptions. You can also trigger an error, and optionally load an error-page.
 *
 * @name Error
 * @package core
 * @subpackage Error
 */
class Error extends Singleton
{
	 	 				
	
	/** Config holder
	 * 
	 * @access private
	 * @var object
	 */
 	private $config;
	
	/** Constructor
	 * 
	 * Registers the error/exception handler.
	 * 
	 * @access public
	 * @return Error
	 */
	public function __construct()
	{
		
		// check singleton
		parent::__construct();
		
		
		// load config
		$this->config = Config::Load();
		
		// register error_handler
		if ($this->config->error->register_error_handler === true) {
			
			error_reporting($this->config->error->error_handler_types);
			set_error_handler(array($this, "errorHandler"), $this->config->error->error_handler_types);
			
		}
		
			
		// register exception_handler
		if ($this->config->error->register_exception_handler === true) {
			
			set_Exception_handler(array($this, "exceptionHandler"));
			
		}
		
		
		// register fatal errors
		//if ($_config->error->fatal_error_handler === true) /* Unimplented function, errors at E_NOTICE also.
			//register_shutdown_function(array($this, 'handleShutdown'))*/;
		
	}
	
	/** Error handler
	 * 
	 * Will be triggered when an error occures. This function shows where what error occured, and echoes a stacktrace.
	 * When triggered, the script shuts down.
	 * 
	 * @access public
	 * @param int $type Error-type, predifined PHP-constant.
	 * @param string $error Description of the error.
	 * @param string $errFile Path of the file where the error occured.
	 * @param int $errLine The line where the error occured.
	 * @param array $context Some for the error relevant variables.
	 * @return void
	 */
	public function errorHandler($type = E_USER_NOTICE, $error = "Undefined error", $errFile = null, $errLine = null, $context = null)
	{
			
		// check type
		$name = self::getType($type);
		
		// send headers
		header("Content-type: text/html");
		
		// show error
		echo '<strong>'.$name.'</strong>: '. $error . ' <br />'. "\n";
		if ($errFile != null || $errLine != null)
			echo 'in file <strong>'.$errFile.':'.$errLine.'.</strong><br /><br />';
		echo '<strong>stacktrace:</strong><br />';
		
		// stacktrace
		$this->stacktrace();
		flush();
		
		// context
		if ($context != null) {
			
			// delete context variables
			unset($context['_helpers'], $context['helpers'], $context['sql'], $context['config'], $context['_config']);
			
			// echo
			echo "<br />Variables: <br />\n<pre>";
			echo htmlspecialchars(preg_replace('/[(pass(w|word)?|user(name)?)] => [a-zA-Z0-9\ \'\"]+/', '[\\1] => HIDDEN', print_r($context, true)));
			echo '</pre>';
			
		}
		
		// die
		die();
	
	}
	
	/** Fatal error handler
	 * 
	 * Is being called on shutdown
	 * 
	 * @access public
	 * @return void
	 */
	public function handleShutdown() 
	{
		
		ob_clean();
		$error = error_get_last();
		
		if ($error !== null) {
			
			$this->errorHandler($error['type'], $error['message'], $error['file'], $error['line']);
			
			
		}
		
	}
	/** Exception handler
	 * 
	 * Will be triggered when an uncaught exception occures. This function shows the error-message, and shuts down the script.
	 * Please note that most of the user-defined exceptions will be caught in the router, and handled with the error-controller.
	 * 
	 * @access public
	 * @param Exception $exception The occured exception.
	 * @return void
	 */
	public function exceptionHandler($exception)
	{
		
		// send headers
		header("Content-type: text/html");
		
		echo "Uncaught exception of type '".get_class($exception)."': ".htmlspecialchars($exception->getMessage()).".<br /><br />\n";
		
		echo '<pre>';
		$temp = htmlspecialchars(print_r((array)$exception, true));
		echo preg_replace('/\[(password|pass|passw|user|username)\] =&gt; (.+?)['."\r\n".']{1,2}/i', '[\1] => HIDDEN'."\n", $temp);
		echo '</pre>';
		
		$this->stacktrace();
		flush();
		
		die();
		
	}
	
	/** Performs a stacktrace
	 * 
	 * Lists which functions were called through the script. Those functions will be echoed.
	 * 
	 * @access public
	 * @return void
	 */
	public function stacktrace()
	{
		
		// get backtrace
		$backtrace = debug_backtrace(~ DEBUG_BACKTRACE_IGNORE_ARGS);
		
		// get names
		foreach($backtrace as $tracePlace){
		
			echo (!empty($tracePlace['function']))	? '<strong>'.$tracePlace['function'].'( )</strong> '	: '';
			echo (!empty($tracePlace['file']))	? 'in file <strong>'.$tracePlace['file'].''		: '';
			echo (!empty($tracePlace['line']))	? ':'.$tracePlace['line'].'</strong> '			: '';
			echo (!empty($tracePlace['class']))	? 'in class <strong>'.$tracePlace['class'].'</strong> '	: '';
			
			echo '<br />' . "\n";
		
		}
		
	}
	
	/** Returns a string representation of an error
	 * 
	 * Turns a PHP error-constant (or integer) into a string representation.
	 * 
	 * @access public
	 * @param int $type PHP-constant errortype (e.g. E_NOTICE).
	 * @return string String representation
	 */
	public function getType($type)
	{
		
		switch ($type)
		{
			
			case E_ERROR:
				return "Error";
			case E_WARNING:
				return "Warning";
			case E_PARSE:
				return "Parse-Error";
			case E_NOTICE:
				return "Notice";
			case E_CORE_ERROR:
				return "PHP-Core error";
			case E_CORE_WARNING:
				return "PHP-Core warning";
			case E_COMPILE_ERROR:
				return "Compile error";
			case E_COMPILE_WARNING:
				return "Compile warning";
			case E_USER_ERROR:
				return "User-triggered error";
			case E_USER_WARNING:
				return "User-triggered warning";
			case E_USER_NOTICE:
				return "User-triggered notice";
			case E_USER_DEPRECATED:
				return "User-triggered deprecated";
			case E_STRICT:
				return "Strict-error";
			case E_RECOVERABLE_ERROR:
				return "Recoverable error";
			case E_DEPRECATED:
				return "Deprecated";
			
				
		}
		
		return $type = 'Unknown error: '.$type;
		
	}
	
	/** Triggers an PHP-error
	 * 
	 * @access public
	 * @param int $error_type PHP error constant.
	 * @param string $error_string Error message.
	 * @return void
	 */
	public function trigger_error($error_string = "An error has occured", $error_type = E_USER_WARNING)
	{
		
		// trigger
		trigger_error($error_string, $error_type);
		
	}
	
	/** Sends HTTP error-headers, and optionally shows an error-view
	 * 
	 * This function can send any HTTP-error header (HTTP/1.1) from 400 through 505. 
	 * You can optionally load an error view at view/errors/*errorNumber*.tpl
	 * 
	 * @access public
	 * @param int $type HTTP status-code
	 * @param bool $view if true: this function loads the matching view and exit
	 * @param string $errorMessage This string is assigned to $error in smarty, and can be used to show additional error-information.
	 * @return void
	 */
	public function http_error($type = 404, $view = true, $errorMessage = '')
	{
		
		$errorCodes = array(
		
			400 => 'Bad Request',
			401 => 'Unauthorized',
			402 => 'Payment Required',
			403 => 'Forbidden',
			404 => 'Not Found',
			405 => 'Method Not Allowed',
			406 => 'Not Acceptable',
			407 => 'Proxy Authentication Required',
			408 => 'Request Timeout',
			409 => 'Conflict',
			410 => 'Gone',
			411 => 'Length Required',
			412 => 'Precondition Failed',
			413 => 'Request Entity Too Large',
			414 => 'Request-URI Too Long',
			415 => 'Unsupported Media Type',
			416 => 'Requested Range Not Satisfiable',
			417 => 'Expectation Failed',
			418 => 'I\'m a teapot',
			426 => 'Upgrade Required',
			428 => 'Precondition Required',
			429 => 'Too Many Requests',
			431 => 'Request Header Fields Too Large',
			500 => 'Internal Server Error',
			501 => 'Not Implemented',
			502 => 'Bad Gateway',
			503 => 'Service Unavailable',
			504 => 'Gateway Timeout',
			505 => 'HTTP Version Not Supported',
			506 => 'Variant Also Negotiates',
			509 => 'Bandwidth Limit Exceeded',
			510 => 'Not Extended',
			511 => 'Network Authentication Required'
		
		);
		
		// send header
		header("HTTP/1.1 ".$type." ".$errorCodes[$type]);
		header("Content-type: text/html");
		
		// load matching view & quit?
		if ($view) {
			
			
			// load new layout?
			if (!class_exists("\System\Layout")) 
				require_once 'system/core/layout.class.php';
				
			if (!class_exists("\System\Controller"))
				require_once 'system/core/controller.class.php';
				
			if (!class_exists("\System\Events"))
				require_once 'system/core/event.class.php';
				
			$layout = Layout::Load();
			
			$layout->assign('error', $errorMessage);
			Events::Load()->injectController(new Controller()); 
			Events::Load()->fire('runtime'); 
			$layout->view('errors/'.$type.'.tpl');
			die();			
			
		}
		
	}
	
	/** Handles an not existing page, using a fake controller.
	 * 
	 * @access public
	 * @return void
	 */
	public function routerError()
	{
		
		require_once 'system/core/controller.class.php';
		eval('class RouterErrorHandler extends \System\Controller{}');
		
		new \RouterErrorHandler();
		
		$this->http_error(404, true);
		
	}
	
}
