<?php
/**
 * @author YAY!Scripting
 * @package files
 */
namespace System;

require_once 'system/functions/__.language.inc.php';

/** Environment
 * 
 * This class handles all language stuff.
 *
 * @name Language
 * @package core
 * @subpackage Router
 */
class Language extends Singleton
{
	
	/** All config-data
	 * 
	 * @access public
	 * @var array $config
	 */
	private $config;
	
	/** The route to use while determining the environment
	 * 
	 * @access private
	 * @var array
	 */
	private $route = null;
	
	/** Cache for languages
	 * 
	 * @access private
	 * @var array
	 */
	private $cache = array();
	
	/** Constructor
	 * 
	 * Saves config.
	 * 
	 * @access public
	 * @return void
	 */
	public function __construct()
	{
		
		// load config
		$this->config = Config::Load();
		
		// checks singleton
		parent::__construct();
		
	}
	
	/** Sets the route
	 * 
	 * @access public
	 * @param array $route The route
	 * @return void
	 */
	public function setRoute(array $route)
	{
		
		$this->route = $route;
		
	}
	
	/** Gets the current language
	 * 
	 * @access public
	 * @return mixed (String: route; null on error)
	 */
	public function getLang()
	{
		
		if (is_null($this->route))
			return null;
			
		if (!$this->config->language->language_on)
			return null;
			
		return preg_replace('/[^a-zA-Z]/s', '', $this->route[0]);
		
	}
	
	
	/** Gets the current language URL-prefix ( with leading / )
	 * 
	 * @access public
	 * @return mixed (String: url; null on error)
	 */
	public function getURL()
	{
		
		if (is_null($this->route))
			return null;
			
		if (!$this->config->language->language_on)
			return null;
			
		return '/'.preg_replace('/[^a-zA-Z]/s', '', $this->route[0]);
		
	}
	
	
	/** Gets the current language-directory (even when language_mode is off)
	 * 
	 * @access public
	 * @return mixed (String: route; null on error)
	 */
	public function getDir()
	{
		
		if ($this->config->language->language_on == false)
			return $this->config->language->default_language;
		
		if (is_null($this->route))
			return $this->config->language->default_language;
			
		return preg_replace('/[^a-zA-Z]/s', '', $this->route[0]);
		
	}
	
	/** Gets the translation of a specific amount of text.
	 * 
	 * @access public
	 * @param string $keyword Word to translate
	 * @param string $language Language to translate to
	 */
	public function translate($keyword, $language = null)
	{
		
		// determine language
		if (is_null($language))
			$language = $this->getLang();
		
		
		// fool-proof
		if (is_null($language)) {
			
			if ($this->config->language->return_default_on_error)
				return $this->translate($keyword, $this->config->language->default_language);
			
			// return_keyword_on_error check
			if (true == $this->config->language->return_keyword_on_error && $language == $this->config->language->default_language)
				return $keyword;
				
			throw new Exception\Translate('The language system is inavailable right now.');
			
		}
		
		if (!file_exists('application/language/'.preg_replace('/[^a-zA-Z]/s', '', $language).'.lang.php')) {
			
			// return_keyword_on_error check
			if (true == $this->config->language->return_keyword_on_error && $language == $this->config->language->default_language)
				return $keyword;
			
			throw new Exception\Translate('The translate-system is unable to provide this language: '.htmlspecialchars($language).'.');
		
		}
		
		// include translation
		if (!is_array($this->cache[$language]))
			$this->cache[$language] = require 'application/language/'.preg_replace('/[^a-zA-Z]/s', '', $language).'.lang.php';
			
		// check if translation exists
		if (empty($this->cache[$language][$keyword])) {
			
			// return_default_on_error-check
			if ($this->config->language->return_default_on_error && $language != $this->config->language->default_language)
				return $this->translate($keyword, $this->config->language->default_language);
				
			
			// return_keyword_on_error check
			if (true == $this->config->language->return_keyword_on_error && $language == $this->config->language->default_language)
				return $keyword;
			
			throw new Exception\Translate('The translate-system is unable to translate the language \''.htmlspecialchars($language).'\' with the following keyword: \''.htmlspecialchars(substr($keyword, 0, 100)).'\'');
			
		}
			
		return $this->cache[$language][$keyword];
		
	}
	
}