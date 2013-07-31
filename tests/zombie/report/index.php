<?php
	set_time_limit(0);

	function get_watch() {
		$watchfile = "../data/watch";
		$f = @fopen($watchfile, "r");
		if (!$f) { die(); }
		$result = fread($f, 10);
		fclose($f);
		return $result;
	}

	$watch = get_watch();

	$ua = $_SERVER["HTTP_USER_AGENT"];
	$passed = $_GET["passed"];
	$failed = $_GET["failed"];

	$datafile = "../data/data";
	$f = @fopen($datafile, "a+");
	fwrite($f, $ua . "\t" . $passed . "\t" . $failed . "\n");
	fclose($f);

	while (1) {
		$w = get_watch();
		if ($w != $watch) {
			echo "location.reload()";
			die();
		}
		sleep(1);
	}
?>
